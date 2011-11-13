InstanceMethods = require("../src/instance_methods")
ClassMethods = require("../src/class_methods")
Associations = require("../src/associations")
Inflector = require "../lib/inflection"
_ = require "../lib/underscore.js"

module.exports = () ->

  class LiveDocument
    _.extend(@prototype, InstanceMethods)
    _.extend(@, ClassMethods)
    _.extend(@, Associations)
    
  return LiveDocument
