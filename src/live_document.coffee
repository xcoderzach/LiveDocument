InstanceMethods = require("../src/instance_methods")
ClassMethods = require("../src/class_methods")
Associations = require("../src/associations")
Inflector = require "../lib/inflection"
_ = require "../lib/underscore.js"

class LiveDocument
  _.extend(@, ClassMethods)
  _.extend(@, Associations)
  _.extend(@prototype, InstanceMethods)
  
module.exports = LiveDocument
