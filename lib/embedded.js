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
  EmbeddedLiveDocument.prototype.sendCreate = function(query, document, callback) {
    socket.emit("LiveDocumentEmbeddedCreate", this.parentDocument.collectionName, this.parentDocument.get("_id"), this.collectionName(), document, function(doc) {
      callback(doc)
    })
  }

  EmbeddedLiveDocument.create = function(document, parentDocument, socket, fn) {
    var instance = new this(parentDocument, document)
    socket.emit("LiveDocumentEmbeddedCreate", parentDocument.collectionName, parentDocument.get("_id"), this.collectionName(), document, function(doc) {
      fn(instance)
    })
    return instance
  }

  return EmbeddedLiveDocument
})
