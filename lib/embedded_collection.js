_ = require("underscore")
Collection = require("./collection")

function EmbeddedCollection(documents, Model, opts) {
  opts = opts || {}
  this.parentId = opts.parentId
  this.parentType = opts.parentType

  Collection.call(this, Model)
  _(documents).each(function(document) {
    var instance = this.add(document)
  }, this)
}

module.exports = EmbeddedCollection

var ctor = function() {}
ctor.prototype = Collection.prototype

EmbeddedCollection.prototype = new ctor

EmbeddedCollection.prototype.push = function(document, callback) {
  var instance = this.add(document)
  instance.save(callback)
  return instance
}

EmbeddedCollection.prototype.add = function(document) {
  var that = this

  if(!this.ids[document._id]) {
    document.parentId = this.parentId
    document.parentType = this.parentType
    document = this.handleInsert(document, true, false)
  }
  return document
}
