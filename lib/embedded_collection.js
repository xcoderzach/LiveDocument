if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore"], function(_) {
 
  function EmbeddedLiveDocumentCollection(documents, parentDocument, Model, socket) {
    this.documents = []
    this.Model = Model
    this.parentDocument = parentDocument
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
      , instance = new this.Model(this.parentDocument, document)

    instance.on("delete", function() {
      that.documents.splice(_(that.documents).indexOf(instance) ,1)
    })
    this.documents.push(instance)
    return instance
  }

  EmbeddedLiveDocumentCollection.prototype.at = function(index) {
    return this.documents[index]
  }                                          

  return EmbeddedLiveDocumentCollection
})
