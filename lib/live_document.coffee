define [ "underscore"
       , "cs!lib/instance_methods"
       , "cs!lib/class_methods"
       , "cs!lib/associations" ]
, (_, InstanceMethods, ClassMethods, Associations) ->


  class LiveDocument
    @socket = if window? && window.socket? then window.socket else {}
    _.extend(@, ClassMethods)
    _.extend(@, Associations)
    _.extend(@prototype, InstanceMethods)
    
  return LiveDocument
