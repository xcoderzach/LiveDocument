var LiveDocument = require("../../lib/document")
  , EmbeddedLiveDocument = require("../../lib/embedded.js")

var Comment = EmbeddedLiveDocument.define("Comment")
  .key("body", { max: 124 })

var BlogPost = module.exports = LiveDocument.define("BlogPost")
  .key("title", { length: [3,24] })
  .many(Comment)
