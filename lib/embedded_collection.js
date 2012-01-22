if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore"], function(_) {
 
  function EmbeddedLiveDocumentCollection(documents, parentDocument, Model, socket) {
    this.documents = documents
    this.Model = Model
    this.parentDocument = parentDocument
    this.socket = socket
  }

  EmbeddedLiveDocumentCollection.prototype.create = function(document, callback) {
    var instance = new this.Model(this.parentDocument, document)
    this.documents.push(instance)
    instance.save(callback)
    return instance
  }
 
  EmbeddedLiveDocumentCollection.prototype.add = function(document) {
    this.documents.push(new this.Model(this.parentDocument, document))
  }

  EmbeddedLiveDocumentCollection.prototype.at = function(index) {
    return this.documents[index]
  }                                          

  return EmbeddedLiveDocumentCollection
})
