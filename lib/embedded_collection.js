_ = require("underscore")
Collection = require("./collection")

function EmbeddedCollection(documents, parentDocument, Model) {
  this.parentDocument = parentDocument
  this.__super__.constructor.call(this, Model)
  _(documents).each(function(document) {
    var instance = this.add(document)
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
  return instance
}

EmbeddedCollection.prototype.add = function(document) {
  var that = this
    , instance
    , id
  if(!(document instanceof this.Model)) {
    id = document._id 
    instance = new this.Model(this.parentDocument, document)
  } else {      
   id = document.get("_id")
   instance = document
  }
  if(!this.ids[id]) {
    this.handleInsert(instance, true, false)
  }
  return instance
}
