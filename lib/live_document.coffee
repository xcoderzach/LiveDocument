define [ "underscore"
       , "cs!lib/instance_methods"
       , "cs!lib/class_methods"
       , "cs!lib/associations"
       , "cs!lib/inflection"
       , "events"]
, (_, InstanceMethods, ClassMethods, Associations, inflect, {EventEmitter}) ->
  _.mixin(inflect)

  class LiveDocument extends EventEmitter
    @socket = if window? && window.socket? then window.socket
    _.extend(@, ClassMethods)
    _.extend(@, Associations)
    _.extend(@prototype, InstanceMethods)
