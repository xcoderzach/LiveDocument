if (typeof define != 'function') then define = (require('amdefine'))(module)
define [ "underscore"
       , "./instance_methods"
       , "./class_methods"
       , "./inflection"
       , "events"]
, (_, InstanceMethods, ClassMethods, inflect, {EventEmitter}) ->
  _.mixin(inflect)

  class LiveDocument extends EventEmitter
      
    @socket = if window? && window.socket? then window.socket
    _.extend(@, ClassMethods)
    _.extend(@prototype, InstanceMethods)

    #basically what coffeescript class syntax does...
    @define: (name) ->
      class SubClass extends LiveDocument
        @modelName = name
      return SubClass
