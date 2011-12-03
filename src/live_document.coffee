define [ "underscore"
       , "lib/LiveDocumentClient/src/instance_methods"
       , "lib/LiveDocumentClient/src/class_methods"
       , "lib/LiveDocumentClient/src/associations"
       , "lib/inflection"]
, (_, InstanceMethods, ClassMethods, Associations) ->

  class LiveDocument
    _.extend(@, ClassMethods)
    _.extend(@, Associations)
    _.extend(@prototype, InstanceMethods)
    
  return LiveDocument
