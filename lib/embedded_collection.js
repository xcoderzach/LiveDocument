if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore"], function(_) {
 
  function EmbeddedLiveDocumentCollection(documents, parentDocument, Model) {
    this.documents = documents
    this.Model = Model
    this.parentDocument = parentDocument
  }

  EmbeddedLiveDocumentCollection.prototype.create = function(document, callback) {
    this.documents.push(this.Model.create(document, this.parentDocument, callback))
  }

  EmbeddedLiveDocumentCollection.prototype.at = function(index) {
    return this.documents[index]
  }                                          

    return EmbeddedLiveDocumentCollection
})
