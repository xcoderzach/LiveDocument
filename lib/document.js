var InstanceMethods = require("./instance_methods")
  , ClassMethods = require("./class_methods")
  , Inflect = require("./inflection")
  , events = require("events")
  , _ = require("underscore")

var EventEmitter = events.EventEmitter

_.mixin(Inflect)

function Document() {}

_.extend(Document, ClassMethods)
_.extend(Document.prototype, InstanceMethods)
_.extend(Document.prototype, EventEmitter.prototype)

if(typeof window !== "undefined" && window.socket) {
  Document.setSocket(window.socket)
}

Document.define = function(name) {
  var SubClass = function() {
    Document.prototype.constructor.apply(this, arguments)
  }
  var ctor = function() {}
  _.extend(SubClass, this)

  ctor.prototype = this.prototype

  SubClass.prototype = new ctor
  SubClass.prototype.constructor = SubClass
  SubClass.prototype.__super__ = Document.prototype
  SubClass.modelName = name

  return SubClass
}

module.exports = Document
