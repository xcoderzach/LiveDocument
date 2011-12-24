define [ "./src/instance_methods"
       , "./src/class_methods"
       , "./src/associations"
       , "./lib/inflection"
       , "socket"]
, (_, InstanceMethods, ClassMethods, Associations, socket) ->


  class LiveDocument
    @socket = socket
    _.extend(@, ClassMethods)
    _.extend(@, Associations)
    _.extend(@prototype, InstanceMethods)
    
  return LiveDocument
