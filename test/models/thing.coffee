{ EventEmitter }      = require "events"
LiveDocument          = require "../../lib/document"

class Thing extends LiveDocument

  @modelName = "Thing"
  @socket = new EventEmitter

  @key "title", { length: [3...24], required: true }
  @key "description", { max: 140 }

module.exports = Thing
