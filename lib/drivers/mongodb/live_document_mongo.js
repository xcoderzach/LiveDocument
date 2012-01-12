var ConditionMatcher = require("./conditional_matcher")
  , DatabaseMethods = require("./database_methods")
  , _ = require("underscore")
/*
 * Takes in a "socket", or any EventEmitter, and a mongodb database connection
 * and listens for updates on the socket
 */
function LiveDocumentMongo(socket, connection) {
    this.db = DatabaseMethods(connection)
    this.setSocket(socket)
}

LiveDocumentMongo.ConditionMatcher = ConditionMatcher
// these should both have limitations, to prevent DOS
LiveDocumentMongo.listeners = []
LiveDocumentMongo.ids = {}


LiveDocumentMongo.prototype.setSocket = function(socket) {
  this.socket = socket
  this.socket.on("LiveDocumentCreate", this.handleCreateMessage.bind(this))
  this.socket.on("LiveDocumentRead", this.handleReadMessage.bind(this))
  this.socket.on("LiveDocumentUpdate", this.handleUpdateMessage.bind(this))
  this.socket.on("LiveDocumentDelete", this.handleDeleteMessage.bind(this))
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
//
// I have no idea how to make this GC atm, meh

LiveDocumentMongo.prototype.watchId = function(id) {
  var that = this
    , cb = function(document, type) {
    that.socket.emit("LiveDocument" + _.capitalize(type) + id, document)
  }
  if(Array.isArray(LiveDocumentMongo.ids[id])) {
    LiveDocumentMongo.ids[id].push(cb)
  } else {
    LiveDocumentMongo.ids[id] = [cb]
  }
}

// Stop watching an id, right now this makes EVERYONE stop watching
// this should only be called if you delete the document
LiveDocumentMongo.prototype.unwatchId = function(id) {
  delete LiveDocumentMongo.ids[id]
}

// Notifies everyone who cares about doc id, sends them newDoc
LiveDocumentMongo.prototype.notifyById = function(id, newDoc, type) {
  _(LiveDocumentMongo.ids[id]).each(function(cb) {
    cb(newDoc, type)
  })
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
    that.watchId(document._id)
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
      that.socket.emit("LiveDocument" + requestNumber, document, method)
    }
    cb(arr, "load")
    _(arr).each(function(doc) {
      that.watchId(doc._id)
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
    
    that.notifyById(newDocument._id, newDocument, "update")

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
    that.notifyById(document._id, document, "delete")
    that.unwatchId(document._id)
    callback(document)
    that.notifyMatchingListeners(document, "remove")
  })
}

module.exports = LiveDocumentMongo
