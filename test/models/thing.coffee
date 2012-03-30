LiveDocument          = require "../../lib/document"

class Thing extends LiveDocument
  @modelName = "Thing"

  @key "title", { length: [3...24], required: true }
  @key "votes"
  @key "description", { max: 140 }

module.exports = Thing
