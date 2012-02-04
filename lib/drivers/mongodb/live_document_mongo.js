var DatabaseMethods  = require("./database_methods")
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

// this should have limitations, to prevent DOS
LiveDocumentMongo.listeners = []

LiveDocumentMongo.prototype.setSocket = function(socket) {
  this.socket = socket
  this.changeDispatch = new ChangeDispatch(
                          this.handleDocumentChange.bind(this)
                        , this.handleCollectionChange.bind(this)
                        )

  this.socket.on("Create", this.handleCreateMessage.bind(this))
  this.socket.on("Read", this.handleReadMessage.bind(this))
  this.socket.on("Update", this.handleUpdateMessage.bind(this))
  this.socket.on("Delete", this.handleDeleteMessage.bind(this))


  this.socket.on("EmbeddedCreate", this.handleEmbeddedCreateMessage.bind(this))
  this.socket.on("EmbeddedUpdate", this.handleEmbeddedUpdateMessage.bind(this))
  this.socket.on("EmbeddedDelete", this.handleEmbeddedDeleteMessage.bind(this))

  //WARNING: POSSIBLE RACE CONDITION: if someone sends a message to unwatch an
  //id, and right after that message is sent, a new id to watch is added, it
  //will be removed and not be watched!
  
  this.socket.on("StopListeningId", this.changeDispatch.unwatchId.bind(this.changeDispatch))
  this.socket.on("StopListeningQuery", this.changeDispatch.unwatchQuery.bind(this.changeDispatch))
}

// Watches a particular id for updates or deletes
LiveDocumentMongo.prototype.handleDocumentChange = function(id, document, type) {
  this.socket.emit(_.capitalize(type), id, document)
}

LiveDocumentMongo.prototype.handleCollectionChange = function(document, queryId, method) {
  this.socket.emit("Request" + queryId, document, method)
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

// When we get a create message, create the document and
// notify the creator and anyone else who cares

LiveDocumentMongo.prototype.handleCreateMessage = function(collection, document, callback) {
  var that = this
  this.db.create(collection, document, function() {
    ChangeDispatch.notifyQueryChange(document, "insert")
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
    that.handleCollectionChange(arr, requestNumber, "load")
    _(arr).each(function(doc) {
      that.watchEmbeddedParentId(doc._id)
      that.changeDispatch.watchId(doc._id)
    })
    that.changeDispatch.watchQuery(conditions, requestNumber)
  })
}
                               
// When we get an update message, update the document, notify the updater
// find out which collections are affected, and notify them 

LiveDocumentMongo.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var that = this
  this.db.update(collection, conditions, document, function(oldDocument, newDocument) {
    callback(newDocument)
    that.notifyById(newDocument._id, newDocument, "change")
    ChangeDispatch.notifyQueryDiff(oldDocument, newDocument)
  })
}                                 

LiveDocumentMongo.prototype.handleDeleteMessage = function(collection, conditions, callback) {
  var that = this
  this.db.delete(collection, conditions, function(document) {
    that.notifyById(document._id, document, "remove")
    that.changeDispatch.unwatchId(document._id)
    callback(document)
    ChangeDispatch.notifyQueryChange(document, "remove")
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
  this.changeDispatch.unwatchAllQueries()
}

module.exports = LiveDocumentMongo
