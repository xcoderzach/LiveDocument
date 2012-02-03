module.exports = function() {
  var LiveDocument = require("../../index")
    , EmbeddedLiveDocument = require("../../lib/embedded.js")

  Comment = EmbeddedLiveDocument.define("Comment")
    .key("body", { max: 124 })

  BlogPost = LiveDocument.define("BlogPost")
    .key("title", { length: [3,24] })
    .many(Comment)

  return BlogPost
}
