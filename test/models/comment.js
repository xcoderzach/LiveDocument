var EmbeddedDocument = require("../../lib/embedded.js")

var Comment = module.exports = EmbeddedDocument.define("Comment")
  .key("body", { max: 124 })
