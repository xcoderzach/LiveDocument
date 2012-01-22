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
  new LiveDocumentMongo(this.internalSocket, connection)

  this.webSocket.on("LiveDocumentCreate", this.handleCreateMessage.bind(this))
  this.webSocket.on("LiveDocumentRead", this.handleReadMessage.bind(this))
  this.webSocket.on("LiveDocumentUpdate", this.handleUpdateMessage.bind(this))
  this.webSocket.on("LiveDocumentDelete", this.handleDeleteMessage.bind(this))

  this.internalSocket.on("LiveDocumentChange", function(id, doc) {
    that.webSocket.emit("LiveDocumentChange", id, doc)   
  })
  this.internalSocket.on("LiveDocumentRemove", function(id, doc) {
    that.webSocket.emit("LiveDocumentRemove", id, doc)   
  })
}

InstanceLayer.prototype.setCurrentUserId = function(currentUserId) {
  this.currentUserId = currentUserId 
}

InstanceLayer.prototype.handleReadMessage = function(collection, document, requestNumber) {
  var that = this
  var Instance = require(this.modelDirectory + "/" + _.singularize(_.underscore(collection)))

  if(typeof Instance.scrub === "undefined") {
    Instance = Instance()
  }

  Instance.currentUserId = this.currentUserId
  this.internalSocket.emit("LiveDocumentRead", collection, document, requestNumber)

  this.internalSocket.on("LiveDocument" + requestNumber, function(data, method) {
    data = Instance.scrub(data)
    that.webSocket.emit("LiveDocument" + requestNumber, data, method)
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
  this.internalSocket.emit("LiveDocumentDelete", collection, query, callback)
}

module.exports = InstanceLayer
