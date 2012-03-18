var DatabaseMethods  = require("./database_methods")
  , EventEmitter     = require("events").EventEmitter
  , ChangeDispatch   = require("./change_dispatch")
  , _                = require("underscore")

/*
 * Takes in a "socket", or any EventEmitter, and a mongodb database connection
 * and listens for updates on the socket
 */

function DocumentServer(socket, connection, modelDirectory) {
  this.db = DatabaseMethods(connection)
  this.setSocket(socket)
  this.embeddedIds = {}
  this.modelDirectory = modelDirectory
}
_.extend(DocumentServer, new EventEmitter)

// this should have limitations, to prevent DOS
DocumentServer.listeners = []

DocumentServer.prototype.setSocket = function(socket) {
  this.socket = socket
  this.changeDispatch = new ChangeDispatch( this.handleDocumentChange.bind(this)
                                          , this.handleCollectionChange.bind(this))

  this.socket.on("Create", this.handleCreateMessage.bind(this))
  this.socket.on("Read", this.handleReadMessage.bind(this))
  this.socket.on("ReadOne", this.handleReadOneMessage.bind(this))
  this.socket.on("Update", this.handleUpdateMessage.bind(this))
  this.socket.on("Delete", this.handleDeleteMessage.bind(this))

  this.socket.on("EmbeddedCreate", this.handleEmbeddedCreateMessage.bind(this))
  this.socket.on("EmbeddedUpdate", this.handleEmbeddedUpdateMessage.bind(this))
  this.socket.on("EmbeddedDelete", this.handleEmbeddedDeleteMessage.bind(this))

  //WARNING: POSSIBLE RACE CONDITION: if someone sends a message to unwatch an
  //id, and right after that message is sent, a new message to watch that id
  //from someone else is added, it will be removed and not be watched!
  //TODO find a better way to do this
  this.socket.on("StopListeningId", this.changeDispatch.unwatchId.bind(this.changeDispatch))
  this.socket.on("StopListeningQuery", this.changeDispatch.unwatchQuery.bind(this.changeDispatch))
}

// Watches a particular id for updates or deletes
DocumentServer.prototype.handleDocumentChange = function(id, document, type, collection) {
  this.socket.emit(_.capitalize(type), id, document, collection)
}

DocumentServer.prototype.handleCollectionChange = function(document, queryId, method) {
  this.socket.emit("Request" + queryId, document, method)
}

DocumentServer.prototype.handleEmbeddedChange = function(parentCollection, parentId, collection, document, type) {
  this.socket.emit("Embedded" + _.capitalize(type), parentCollection, parentId, collection, _.clone(document))
}

DocumentServer.prototype.watchEmbeddedParentId = function(id) {
  var that = this
  var handler = this.handleEmbeddedChange.bind(this)
  this.embeddedIds[id] = {
    unwatch: function() { 
      DocumentServer.removeListener("EmbeddedChange" + id, handler)
      delete that.embeddedIds[id]
    }
  }
  DocumentServer.on("EmbeddedChange" + id, handler)
} 

DocumentServer.prototype.embeddedNotifyById = function(parentCollection, parentId, collection, newDoc, type) {
  DocumentServer.emit("EmbeddedChange" + parentId, parentCollection, parentId, collection, newDoc, type)
}

// Notifies everyone who cares about doc id, sends them newDoc
DocumentServer.prototype.notifyById = function(id, newDoc, type, collection) {
  ChangeDispatch.notifyIdChange(id, newDoc, type, collection)
}

// When we get a create message, create the document and
// notify the creator and anyone else who cares

DocumentServer.prototype.handleCreateMessage = function(collection, document, callback) {
  var that = this
  this.db.collection(collection).create(document, function() {
    console.log()
    ChangeDispatch.notifyQueryChange(document, "insert")
    that.watchEmbeddedParentId(document._id)
    that.changeDispatch.watchId(document._id)
    callback(document)
  })
}
// When we get a read message, get the contents out of the database
// give them to the requester, and then start listening for any changes
// that pertain to these conditions

DocumentServer.prototype.handleReadMessage = function(collection, conditions, requestNumber) {
  var that = this
  this.db.collection(collection).read(conditions, function(arr) {
    that.handleCollectionChange(arr, requestNumber, "load")
    _(arr).each(function(doc) {
      that.watchEmbeddedParentId(doc._id)
      that.changeDispatch.watchId(doc._id)
    })
    that.changeDispatch.watchQuery(conditions, requestNumber)
  })
}

DocumentServer.prototype.handleReadOneMessage = function(collection, conditions, callback) {
  var that = this
  this.db.collection(collection).readOne(conditions, function(doc) {
    if(doc) {
      that.watchEmbeddedParentId(doc._id)
      that.changeDispatch.watchId(doc._id)
    }
    callback(doc)
  })
}
                               
// When we get an update message, update the document, notify the updater
// find out which collections are affected, and notify them 

DocumentServer.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var that = this
  this.db.collection(collection).update(conditions, document, function(oldDocument, newDocument) {
    callback(newDocument)
    that.notifyById(newDocument._id, newDocument, "change", collection)
    ChangeDispatch.notifyQueryDiff(oldDocument, newDocument)
  })
}                                 

DocumentServer.prototype.handleDeleteMessage = function(collection, conditions, callback) {
  var that = this
  this.db.collection(collection).remove(conditions, function(document) {
    that.notifyById(document._id, document, "remove", collection)
    that.changeDispatch.unwatchId(document._id)
    callback(document)
    ChangeDispatch.notifyQueryChange(document, "remove")
  })
}

DocumentServer.prototype.handleEmbeddedCreateMessage = function(parentCollection, parentId, collection, document, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).createEmbedded(document, function(doc) {
    callback(doc)
    that.embeddedNotifyById(parentCollection, parentId, collection, doc, "insert")
  })
}

DocumentServer.prototype.handleEmbeddedUpdateMessage = function(parentCollection, parentId, collection, id, document, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).updateEmbedded(id, document, function(doc) {
    callback(doc)
    that.embeddedNotifyById(parentCollection, parentId, collection, doc, "change")
  })
}

DocumentServer.prototype.handleEmbeddedDeleteMessage = function(parentCollection, parentId, collection, id, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).removeEmbedded(id, function(doc) {
    callback()
    that.embeddedNotifyById(parentCollection, parentId, collection, {_id: id}, "remove")
  })
}

DocumentServer.prototype.cleanup = function() {
  this.changeDispatch.unwatchAllIds()
  this.changeDispatch.unwatchAllQueries()
}

DocumentServer.create = function() {
  this.createMiddleware = this.createMiddleware || []
}

module.exports = DocumentServer
