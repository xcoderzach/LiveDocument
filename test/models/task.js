var LiveDocument = require("../../lib/document")

module.exports = LiveDocument.define("Task")
  .key("title", { length: [3,24] })
