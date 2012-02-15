var LiveDocument = require("../../index")
  , Profile      = require("./profile")

var User = LiveDocument.define("User")
  .key("name", { length: [3,24] })
  .key("job", { max: 140 })
  .editableBy("self")
  .one(Profile)

module.exports = User 
