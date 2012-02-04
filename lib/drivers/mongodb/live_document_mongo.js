var ConditionMatcher = require("./conditional_matcher")
  , DatabaseMethods  = require("./database_methods")
  , _                = require("underscore")
  , EventEmitter     = require("events").EventEmitter
  , ChangeDispatch   = require("./change_dispatch")
/*
 * Takes in a "socket", or any EventEmitter, and a mongodb database connection
 * and listens for updates on the socket
 */

function LiveDocumentMongo(socket, connection) {
  this.db = DatabaseMethods(connection)
  this.setSocket(socket)
  this.embeddedIds = {}
}
_.extend(LiveDocumentMongo, new EventEmitter)

LiveDocumentMongo.ConditionMatcher = ConditionMatcher

// this should have limitations, to prevent DOS
LiveDocumentMongo.listeners = []

LiveDocumentMongo.prototype.setSocket = function(socket) {
  this.socket = socket
  this.changeDispatch = new ChangeDispatch(this.handleDocumentChange.bind(this))

  this.socket.on("Create", this.handleCreateMessage.bind(this))
  this.socket.on("Read", this.handleReadMessage.bind(this))
  this.socket.on("Update", this.handleUpdateMessage.bind(this))
  this.socket.on("Delete", this.handleDeleteMessage.bind(this))


  this.socket.on("EmbeddedCreate", this.handleEmbeddedCreateMessage.bind(this))
  this.socket.on("EmbeddedUpdate", this.handleEmbeddedUpdateMessage.bind(this))
  this.socket.on("EmbeddedDelete", this.handleEmbeddedDeleteMessage.bind(this))

  this.socket.on("NotListening", this.changeDispatch.unwatchId.bind(this.changeDispatch))
}
  // Takes in a document and finds all the listeners who would like to be
  // notified about it

LiveDocumentMongo.prototype.matchingListeners = function(document) {
  var callbacks = []
  LiveDocumentMongo.listeners.forEach(function(listener) {
    var callback = listener.callback
      , conditions = listener.conditions
    if(LiveDocumentMongo.ConditionMatcher.match(document, conditions)) {
      callbacks.push(callback)
    }
  })
  return callbacks
}

// Watches a particular id for updates or deletes

LiveDocumentMongo.prototype.handleDocumentChange = function(id, document, type) {
  this.socket.emit(_.capitalize(type), id, document)
}

LiveDocumentMongo.prototype.handleEmbeddedChange = function(parentCollection, parentId, collection, document, type) {
  this.socket.emit("Embedded" + _.capitalize(type), parentCollection, parentId, collection, document)
}

LiveDocumentMongo.prototype.watchEmbeddedParentId = function(id) {
  var that = this
  var handler = this.handleEmbeddedChange.bind(this)
  this.embeddedIds[id] = {
    unwatch: function() { 
      LiveDocumentMongo.removeListener("EmbeddedChange" + id, handler)
      delete that.embeddedIds[id]
    }
  }
  LiveDocumentMongo.on("EmbeddedChange" + id, handler)
} 

LiveDocumentMongo.prototype.embeddedNotifyById = function(parentCollection, parentId, collection, newDoc, type) {
  LiveDocumentMongo.emit("EmbeddedChange" + parentId, parentCollection, parentId, collection, newDoc, type)
}

// Notifies everyone who cares about doc id, sends them newDoc
LiveDocumentMongo.prototype.notifyById = function(id, newDoc, type) {
  ChangeDispatch.notifyIdChange(id, newDoc, type)
}

// notifies an array of _listeners_ notifying them that
// _event_ happened to _document_
// _method_ can be update, delete, insert

LiveDocumentMongo.prototype.notifyListeners = function(listeners, document, event) {
  listeners.forEach(function(callback) {
    callback(document, event)
  })
}
// Notifies all things that care about 
// _document_ that _event_ happened to it

LiveDocumentMongo.prototype.notifyMatchingListeners = function(document, event) {
  var matching = this.matchingListeners(document)
  this.notifyListeners(matching, document, event)
}
// When we get a create message, create the document and
// notify the creator and anyone else who cares

LiveDocumentMongo.prototype.handleCreateMessage = function(collection, document, callback) {
  var that = this
  this.db.create(collection, document, function() {
    that.notifyMatchingListeners(document, "insert")
    that.watchEmbeddedParentId(document._id)
    that.changeDispatch.watchId(document._id)
    callback(document)
  })
}
// When we get a read message, get the contents out of the database
// give them to the requester, and then start listening for any changes
// that pertain to these conditions

LiveDocumentMongo.prototype.handleReadMessage = function(collection, conditions, requestNumber) {
  var that = this
  this.db.read(collection, conditions, function(arr) {
    var cb = function(document, method) {
      that.socket.emit("Request" + requestNumber, document, method)
    }
    cb(arr, "load")
    _(arr).each(function(doc) {
      that.watchEmbeddedParentId(doc._id)
      that.changeDispatch.watchId(doc._id)
    })
    LiveDocumentMongo.listeners.push({ callback: cb, conditions: conditions })
  })
}
                               
// When we get an update message, update the document, notify the updater
// find out which collections are affected, and notify them 

LiveDocumentMongo.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var that = this
  this.db.update(collection, conditions, document, function(oldDocument, newDocument) {
    var oldListeners
      , newListeners
      , removeNotifications
      , insertNotifications
    //notify the updater
    callback(newDocument)
    
    that.notifyById(newDocument._id, newDocument, "change")

    oldListeners = that.matchingListeners(oldDocument)
    newListeners = that.matchingListeners(newDocument)

    // Documents whose conditions are in oldListeners but not newListeners
    // get remove notifications
    removeNotifications = _(oldListeners).difference(newListeners)
    // Documents whose conditions are in newListeners but not oldListeners
    // get insert notifications
    insertNotifications = _(newListeners).difference(oldListeners)

    that.notifyListeners(removeNotifications, oldDocument, "remove")
    that.notifyListeners(insertNotifications, newDocument, "insert")
  })
}                                 
// When we get a delete message notify the deleter and all the people who
// care about it 

LiveDocumentMongo.prototype.handleDeleteMessage = function(collection, conditions, callback) {
  var that = this
  this.db.delete(collection, conditions, function(document) {
    that.notifyById(document._id, document, "remove")
    that.changeDispatch.unwatchId(document._id)
    callback(document)
    that.notifyMatchingListeners(document, "remove")
  })
}

LiveDocumentMongo.prototype.handleEmbeddedCreateMessage = function(parentCollection, parentId, collection, document, callback) {
  this.db.createEmbedded(parentCollection, parentId, collection, document, callback)
  this.embeddedNotifyById(parentCollection, parentId, collection, document, "insert")
}

LiveDocumentMongo.prototype.handleEmbeddedUpdateMessage = function(parentCollection, parentId, collection, id, document, callback) {
  this.db.updateEmbedded(parentCollection, parentId, collection, id, document, callback)
  this.embeddedNotifyById(parentCollection, parentId, collection, document, "change")
}

LiveDocumentMongo.prototype.handleEmbeddedDeleteMessage = function(parentCollection, parentId, collection, document, callback) {
  this.db.removeEmbedded(parentCollection, parentId, collection, document, callback)
  this.embeddedNotifyById(parentCollection, parentId, collection, document, "remove")
}

LiveDocumentMongo.prototype.cleanup = function() {
  this.changeDispatch.unwatchAllIds()
}

module.exports = LiveDocumentMongo
