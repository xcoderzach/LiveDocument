var InstanceMethods  = require("./instance_methods")
  , ClassMethods = require("./class_methods")
  , Inflect = require("./inflection")
  , EventEmitter = require("events").EventEmitter
  , _ = require("underscore") 

_.mixin(Inflect)

function LiveDocument() {}
_.extend(LiveDocument, ClassMethods)
_.extend(LiveDocument.prototype, InstanceMethods)
_.extend(LiveDocument.prototype, new EventEmitter)

LiveDocument.define = function(name) {
  var SubClass = function() {
    this.__super__.constructor.apply(this, arguments)
  }
    , ctor = function() {}
  _.extend(SubClass, this)

  ctor.prototype = this.prototype

  SubClass.prototype = new ctor
  SubClass.prototype.constructor = SubClass
  SubClass.prototype.__super__ = LiveDocument.prototype
  SubClass.modelName = name

  return SubClass
}

module.exports = LiveDocument
