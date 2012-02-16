_ = require("underscore")
LiveDocumentCollection = require("./live_document_collection")

function EmbeddedLiveDocumentCollection(documents, parentDocument, Model) {
  this.parentDocument = parentDocument
  this.__super__.constructor.call(this, Model)
  _(documents).each(function(document) {
    this.add(document)
  }, this)
}

module.exports = EmbeddedLiveDocumentCollection

var ctor = function() {}
ctor.prototype = LiveDocumentCollection.prototype

EmbeddedLiveDocumentCollection.prototype = new ctor
EmbeddedLiveDocumentCollection.prototype.__super__ = LiveDocumentCollection.prototype

EmbeddedLiveDocumentCollection.prototype.create = function(document, callback) {
  var instance = this.add(document)
  instance.save(callback)
}

EmbeddedLiveDocumentCollection.prototype.add = function(document) {
  var that = this
    , instance
    , id = document._id
  if(!this.ids[id]) {
    instance = new this.Model(this.parentDocument, document)
    this.handleInsert(instance, true, false)
  }
  return instance
}
