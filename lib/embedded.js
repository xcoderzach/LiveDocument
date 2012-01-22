if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore", "./live_document"], function(_, LiveDocument) {

  function EmbeddedLiveDocument(parentDocument, document, opts) {
    this.parentDocument = parentDocument
    LiveDocument.prototype.constructor.call(this, document, opts)
  }

  _.extend(EmbeddedLiveDocument, LiveDocument)

  ctor = function () {}
  ctor.prototype = LiveDocument.prototype
  EmbeddedLiveDocument.prototype = new ctor

  EmbeddedLiveDocument.create = function(document, parentDocument, socket, fn) {
    var instance = new this(document)
    socket.emit("LiveDocumentEmbeddedCreate", parentDocument.collectionName, parentDocument.get("_id"), this.collectionName(), document, function(doc) {
      fn(instance)
    })
    return instance
  }

  return EmbeddedLiveDocument
})
