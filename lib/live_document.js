var InstanceMethods = require("./instance_methods")
  , ClassMethods = require("./class_methods")
  , Inflect = require("./inflection")
  , events = require("events")
  , _ = require("underscore")

var EventEmitter = events.EventEmitter

_.mixin(Inflect)

function LiveDocument() {}

_.extend(LiveDocument, ClassMethods)
_.extend(LiveDocument.prototype, InstanceMethods)
_.extend(LiveDocument.prototype, EventEmitter.prototype)

if(typeof window !== "undefined" && window.socket) {
  LiveDocument.setSocket(window.socket)
}

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
