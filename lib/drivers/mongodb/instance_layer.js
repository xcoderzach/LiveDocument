var LiveDocumentMongo = require("./live_document_mongo")
  , EventEmitter = require("events").EventEmitter
  , _ = require("underscore")
  , Inflector = require("./../../inflection")

  _.mixin(Inflector)


function InstanceLayer(webSocket, connection, modelDirectory, currentUserId) {
  var that = this
  this.webSocket = webSocket

  this.internalSocket = new EventEmitter
  this.currentUserId = currentUserId

  this.modelDirectory = modelDirectory
  this.liveDocumentMongo = new LiveDocumentMongo(this.internalSocket, connection)

  this.webSocket.on("Create", this.handleCreateMessage.bind(this))
  this.webSocket.on("Read", this.handleReadMessage.bind(this))
  this.webSocket.on("Update", this.handleUpdateMessage.bind(this))
  this.webSocket.on("Delete", this.handleDeleteMessage.bind(this))
                     
  this.webSocket.on("EmbeddedCreate", this.handleEmbeddedCreateMessage.bind(this))
  this.webSocket.on("EmbeddedUpdate", this.handleEmbeddedUpdateMessage.bind(this))
  this.webSocket.on("EmbeddedDelete", this.handleEmbeddedDeleteMessage.bind(this))

  this.webSocket.on("StopListeningId", function(id) {
    that.internalSocket.emit("StopListeningId", id)
  })
  this.webSocket.on("StopListeningQuery", function(id) {
    that.internalSocket.emit("StopListeningQuery", id)
  })
 
  this.internalSocket.on("Change", function(id, doc) {
    that.webSocket.emit("Change", id, doc)   
  })
  this.internalSocket.on("Remove", function(id, doc) {
    that.webSocket.emit("Remove", id, doc)   
  })

  this.internalSocket.on("EmbeddedInsert", function(parentCollection, parentId, collection, doc) {
    that.webSocket.emit("EmbeddedInsert", parentCollection, parentId, collection, doc._id, doc)   
  })

  this.internalSocket.on("EmbeddedRemove", function(parentCollection, parentId, collection, id) {
    that.webSocket.emit("EmbeddedRemove", parentCollection, parentId, collection, id)   
  })
}

InstanceLayer.prototype.setCurrentUserId = function(currentUserId) {
  this.currentUserId = currentUserId 
}

InstanceLayer.prototype.handleEmbeddedCreateMessage = function(parentCollection, parentId, collection, document, callback) {
  this.internalSocket.emit("EmbeddedCreate", parentCollection, parentId, collection, document, callback)
}

InstanceLayer.prototype.handleEmbeddedUpdateMessage = function(parentCollection, parentId, collection, id, document, callback) {
  this.internalSocket.emit("EmbeddedUpdate", parentCollection, parentId, collection, id, document, callback)
}

InstanceLayer.prototype.handleEmbeddedDeleteMessage = function(parentCollection, parentId, collection, conditions, callback) {
  this.internalSocket.emit("EmbeddedDelete", parentCollection, parentId, collection, conditions, callback)
}

InstanceLayer.prototype.handleReadMessage = function(collection, document, requestNumber) {
  var that = this
  var Instance = require(this.modelDirectory + "/" + _.singularize(_.underscore(collection)))

  if(typeof Instance.scrub === "undefined") {
    Instance = Instance()
  }

  Instance.currentUserId = this.currentUserId
  this.internalSocket.emit("Read", collection, document, requestNumber)

  this.internalSocket.on("Request" + requestNumber, function(data, method) {
    data = Instance.scrub(data)
    that.webSocket.emit("Request" + requestNumber, data, method)
  })
}

InstanceLayer.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var Instance = require(this.modelDirectory + "/" + _.singularize(_.underscore(collection)))
  if(typeof Instance.findOne === "undefined") {
    Instance = Instance()
  }
  Instance.socket = this.internalSocket
  Instance.currentUserId = this.currentUserId

  Instance.findOne(conditions, function(instance) {
    instance.persisted = true
    document = Instance.scrub(document)
    instance.set(document)
    instance.save(function() {
      document = Instance.scrub(instance.document)
      callback(document)
    })
  })
}

InstanceLayer.prototype.handleCreateMessage = function(collection, document, callback) {
  var that = this
  var Instance = require(this.modelDirectory + "/" + _.singularize(_.underscore(collection)))
  if(typeof Instance.create === "undefined") {
    Instance = Instance()
  }
  Instance.currentUserId = this.currentUserId
  Instance.socket = this.internalSocket

  Instance.create(document, function() {
    callback()
  })
}

InstanceLayer.prototype.handleDeleteMessage = function(collection, query, callback) {
  this.internalSocket.emit("Delete", collection, query, callback)
}

InstanceLayer.prototype.cleanup = function() {
  this.liveDocumentMongo.cleanup()
  delete this.internalSocket

}

module.exports = InstanceLayer
