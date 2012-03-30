var LiveDocument = require("../../lib/document")

var BlogPost = module.exports = LiveDocument.define("BlogPost")

BlogPost 
  .key("title", { length: [3,24] })
  .many(require("./comment"))
