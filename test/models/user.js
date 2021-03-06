var LiveDocument = require("../../lib/document")
  , Profile      = require("./profile")

var User = module.exports = LiveDocument.define("User")

var Contacts = require("./contact")

User
  .key("name", { length: [3, 24] })
  .key("job", { max: 140 })
  .one(Profile, { dependent: true })
  .many(Contacts)
