if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore"], function(_) {
 
  function EmbeddedLiveDocumentCollection(documents, parentDocument, Model, socket) {
    this.documents = []
    this.Model = Model
    this.parentDocument = parentDocument
    this.ids = {}
    this.socket = socket
    _(documents).each(function(document) {
      this.add(document)
    }, this)
  }

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
      id = instance.get("_id")
    
      this.documents.push(id)
      this.ids[id] = instance
    }
    return instance
  }

  EmbeddedLiveDocumentCollection.prototype.remove = function(document) {
    var that = this
    this.documents = _(this.documents).filter(function(id) {
      var match = id !== document._id 
      delete that.ids[id]
      return match
    })
  }

  EmbeddedLiveDocumentCollection.prototype.at = function(index) {
    return this.ids[this.documents[index]]
  }                                          

  return EmbeddedLiveDocumentCollection
})
