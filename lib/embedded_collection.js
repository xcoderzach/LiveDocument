_ = require("underscore")
Collection = require("./collection")

function EmbeddedCollection(documents, parentDocument, Model) {
  this.parentDocument = parentDocument
  this.__super__.constructor.call(this, Model)
  _(documents).each(function(document) {
    this.add(document)
  }, this)
}

module.exports = EmbeddedCollection

var ctor = function() {}
ctor.prototype = Collection.prototype

EmbeddedCollection.prototype = new ctor
EmbeddedCollection.prototype.__super__ = Collection.prototype

EmbeddedCollection.prototype.create = function(document, callback) {
  var instance = this.add(document)
  instance.save(callback)
}

EmbeddedCollection.prototype.add = function(document) {
  var that = this
    , instance
    , id = document._id
  if(!this.ids[id]) {
    instance = new this.Model(this.parentDocument, document)
    this.handleInsert(instance, true, false)
  }
  return instance
}
