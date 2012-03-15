var EmbeddedLiveDocument = require("../../lib/embedded")

var Contact = module.exports = EmbeddedLiveDocument.define("Contact")
  , User = require("./user")

Contact
  .one(User)
  .key("type")
