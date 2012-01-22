if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define(["underscore", "./class_methods"], function(_, ClassMethods) {


  function EmbeddedLiveDocument(document) {
    this.document = document
  }

  EmbeddedLiveDocument.prototype.get = function(field) {
    return this.document[field]
  }

  EmbeddedLiveDocument.define = function(name) {
    var SubClass = function() {
      this.__super__.constructor.apply(this, arguments)
    }
      , ctor = function() {}
    _.extend(SubClass, this)

    ctor.prototype = this.prototype

    SubClass.prototype = new ctor
    SubClass.prototype.constructor = SubClass
    SubClass.prototype.__super__ = this.prototype
    SubClass.modelName = name

    return SubClass 
  }

  EmbeddedLiveDocument.collectionName = ClassMethods.collectionName

  EmbeddedLiveDocument.create = function(document, parentDocument, fn) {
    var instance = new this(document)
    process.nextTick(function() {
      fn(instance)
    })
    return instance
  }

  EmbeddedLiveDocument.key = ClassMethods.key

  return EmbeddedLiveDocument

})
