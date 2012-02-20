var Document = require("./document")
  , _ = require("underscore")

function EmbeddedDocument(parentDocument, document, opts) {
  this.parentDocument = parentDocument
  this.__super__.constructor.call(this, document, opts)
}

_.extend(EmbeddedDocument, Document)
module.exports = EmbeddedDocument

ctor = function () {}
ctor.prototype = Document.prototype
EmbeddedDocument.prototype = new ctor
EmbeddedDocument.prototype.constructor = EmbeddedDocument
EmbeddedDocument.prototype.__super__ = Document.prototype
EmbeddedDocument.embedded = true

EmbeddedDocument.define = function(name) {
  function SubClass(parentDocument, document, opts) {
    this.parentDocument = parentDocument
    this.__super__.constructor.call(this, document, opts)
  }
  var ctor = function() {}

  _.extend(SubClass, this)

  ctor.prototype = this.prototype

  SubClass.prototype = new ctor
  SubClass.prototype.constructor = SubClass
  SubClass.prototype.__super__ = Document.prototype
  SubClass.modelName = name

  return SubClass
} 

EmbeddedDocument.prototype.sendCreate = function(document, callback) {
  console.log("sending create")
  this.parentDocument.constructor.socket.emit("EmbeddedCreate", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName, document, function(doc) {
    callback(doc)
  })
}

EmbeddedDocument.prototype.sendUpdate = function(id, document, callback) {
  console.log("sending update")
  id = id._id
  this.parentDocument.constructor.socket.emit("EmbeddedUpdate", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName, id, document, function(doc) {
    callback(doc)
  })
} 

EmbeddedDocument.prototype.remove = function(callback) {
  callback = callback || function() {}
  var that = this
  this.parentDocument.constructor.socket.emit("EmbeddedDelete", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName, {_id: this.get("_id")}, function(doc) {
    that.deleted = true
    that.emit("delete", that)
    callback(that)
  })
}

return EmbeddedDocument
