var LiveDocumentMongo = require("./live_document_mongo")
  , EventEmitter = require("events").EventEmitter
  , _ = require("underscore")
  , Inflector = require("./../../inflection")
  , pathToModels = "./../../../../../../app/models"

  _.mixin(Inflector)

function InstanceLayer(webSocket, connection) {
  this.webSocket = webSocket
  this.internalSocket = new EventEmitter
  new LiveDocumentMongo(this.internalSocket, connection)

  this.webSocket.on("LiveDocumentCreate", this.handleCreateMessage.bind(this))
  this.webSocket.on("LiveDocumentRead", this.handleReadMessage.bind(this))
  this.webSocket.on("LiveDocumentUpdate", this.handleUpdateMessage.bind(this))
  this.webSocket.on("LiveDocumentDelete", this.handleDeleteMessage.bind(this))
}

InstanceLayer.prototype.handleReadMessage = function(collection, document, requestNumber) {
  var that = this
  var Instance = require(pathToModels + "/" + _.singularize(collection))
  this.internalSocket.emit("LiveDocumentRead", collection, document, requestNumber)

  this.internalSocket.on("LiveDocument" + requestNumber, function(data, method) {
    data = Instance.scrub(data)
    that.webSocket.emit("LiveDocument" + requestNumber, data, method)
  })
}

InstanceLayer.prototype.handleUpdateMessage = function(collection, conditions, document, callback) {
  var Instance = require(pathToModels + "/" + _.singularize(collection))
  Instance.socket = this.internalSocket

  Instance.findOne(conditions, function(instance) {
    document = Instance.scrub(document)
    instance.set(document)
    instance.save(callback)
  })

}

InstanceLayer.prototype.handleCreateMessage = function(collection, document, callback) {
  var Instance = require(pathToModels + "/" + _.singularize(collection))
  Instance.socket = this.internalSocket

  Instance.create(document, function() {
    callback()
  })
}

InstanceLayer.prototype.handleDeleteMessage = function(collection, query, callback) {
  this.internalSocket.emit("LiveDocumentDelete", collection, query, callback)
}

module.exports = InstanceLayer
