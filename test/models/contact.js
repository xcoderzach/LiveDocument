var EmbeddedLiveDocument = require("../../lib/embedded.js")

var Contact = module.exports = EmbeddedLiveDocument.define("Contact")
  , User = require("./user")

Contact
  .one(User)
  .key("type")
