if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["./instance_methods", "./class_methods", "./inflection", "events", "underscore"]
      , function(InstanceMethods , ClassMethods, Inflect, events, _) {
  var EventEmitter = events.EventEmitter

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

  return LiveDocument
})
