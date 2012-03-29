var DatabaseMethods  = require("./database_methods")
  , EventEmitter     = require("events").EventEmitter
  , ChangeDispatch   = require("./change_dispatch")
  , _                = require("underscore")
  , Document         = require("../document")

/*
 * Takes in a "socket", or any EventEmitter, and a mongodb database connection
 * and listens for updates on the socket
 */

function DocumentServer(socket, connection, modelDirectory) {
  this.changeDispatch = new ChangeDispatch( this.handleDocumentChange.bind(this)
                                          , this.handleCollectionChange.bind(this))

  this.db = DatabaseMethods(connection, ChangeDispatch)
  Document.prototype.db = this.db
  this.connection = connection
  this.setSocket(socket)
  this.embeddedIds = {}
  this.modelDirectory = modelDirectory
}
_.extend(DocumentServer, new EventEmitter)

// this should have limitations, to prevent DOS
DocumentServer.listeners = []

DocumentServer.prototype.setSocket = function(socket) {
  this.socket = socket

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
DocumentServer.prototype.handleDocumentChange = function(id, document, type, collection, embeddedCollection) {
  //change events just send the id of the embedded document and the client will
  //do the right thing
  if(embeddedCollection) {
    if(type === "change") {
      this.socket.emit(_.capitalize(type), document._id, document, embeddedCollection)
    } else {
      this.socket.emit("Embedded" + _.capitalize(type), collection, id, embeddedCollection, document)
    }
  } else {
    this.socket.emit(_.capitalize(type), id, document, collection)
  }
}

DocumentServer.prototype.handleCollectionChange = function(document, queryId, method) {
  this.socket.emit("Request" + queryId, document, method)
}


// When we get a create message, create the document and
// notify the creator and anyone else who cares

DocumentServer.prototype.handleCreateMessage = function(collection, document, callback) {
  var that = this
    , Model = require(this.modelDirectory + "/" + _.underscore(_.singularize(collection)))
  Model.create(document, function(model) {
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
      that.changeDispatch.watchId(doc._id)
    })
    that.changeDispatch.watchQuery(conditions, requestNumber, collection)
  })
}

DocumentServer.prototype.handleReadOneMessage = function(collection, conditions, callback) {
  var that = this
  this.db.collection(collection).readOne(conditions, function(doc) {
    if(doc) {
      that.changeDispatch.watchId(doc._id)
    }
    callback(doc)
  })
}
                               
// When we get an update message, update the document, notify the updater
// find out which collections are affected, and notify them 

DocumentServer.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var that = this
  this.db.collection(collection).update(conditions, document, callback)
}                                 

DocumentServer.prototype.handleDeleteMessage = function(collection, id, callback) {
  var that = this
    , Model = require(this.modelDirectory + "/" + _.underscore(_.singularize(collection)))
  Model.findOne(id, function(instance) {
    instance.remove(function() {
      //TODO remove should not be sending empty documents (objects) back to the client
      that.changeDispatch.unwatchId(id)
      callback(instance.document)
      ChangeDispatch.notifyQueryChange(instance.document, "remove", collection)
    })
  })
}

DocumentServer.prototype.handleEmbeddedCreateMessage = function(parentCollection, parentId, collection, document, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).createEmbedded(document, function(doc) {
    callback(doc)
  })
}

DocumentServer.prototype.handleEmbeddedUpdateMessage = function(parentCollection, parentId, collection, id, document, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).updateEmbedded(id, document, function(doc) {
    callback(doc)
  })
}

DocumentServer.prototype.handleEmbeddedDeleteMessage = function(parentCollection, parentId, collection, id, callback) {
  var that = this
  this.db.embedded(parentCollection, parentId, collection).removeEmbedded(id, function(doc) {
    callback()
  })
}

DocumentServer.prototype.cleanup = function() {
  this.changeDispatch.unwatchAllIds()
  this.changeDispatch.unwatchAllQueries()
}

module.exports = DocumentServer
