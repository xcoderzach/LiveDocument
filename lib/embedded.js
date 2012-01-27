if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore", "./live_document"], function(_, LiveDocument) {

  function EmbeddedLiveDocument(parentDocument, document, opts) {
    this.parentDocument = parentDocument
    this.__super__.constructor.call(this, document, opts)
  }

  _.extend(EmbeddedLiveDocument, LiveDocument)

  ctor = function () {}
  ctor.prototype = LiveDocument.prototype
  EmbeddedLiveDocument.prototype = new ctor
  EmbeddedLiveDocument.prototype.constructor = EmbeddedLiveDocument
  EmbeddedLiveDocument.prototype.__super__ = LiveDocument.prototype

  EmbeddedLiveDocument.define = function(name) {
    function SubClass(parentDocument, document, opts) {
      this.parentDocument = parentDocument
      this.__super__.constructor.call(this, document, opts)
    }
    var ctor = function() {}

    _.extend(SubClass, this)

    ctor.prototype = this.prototype

    SubClass.prototype = new ctor
    SubClass.prototype.constructor = SubClass
    SubClass.prototype.__super__ = LiveDocument.prototype
    SubClass.modelName = name

    return SubClass
  } 
  EmbeddedLiveDocument.prototype.sendCreate = function(document, callback) {
    this.parentDocument.constructor.socket.emit("EmbeddedCreate", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName, document, function(doc) {
      callback(doc)
    })
  }

  EmbeddedLiveDocument.prototype.remove = function(callback) {
    var that = this
    this.parentDocument.constructor.socket.emit("EmbeddedDelete", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName, {_id: this.get("_id")}, function(doc) {
      that.deleted = true
      that.emit("delete", that)
      callback(that)
    })
  }

  return EmbeddedLiveDocument
})