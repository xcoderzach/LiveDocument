var LiveDocument = require("../../index")
  , Profile      = require("./profile")

var User = module.exports = LiveDocument.define("User")

var Contacts = require("./contact")

User
  .key("name", { length: [3,24] })
  .key("job", { max: 140 })
  .editableBy("self")
  .one(Profile)
  .many(Contacts)
