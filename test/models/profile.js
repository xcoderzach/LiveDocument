var LiveDocument = require("../../index")

var Profile = LiveDocument.define("Profile")
  .key("realName")

module.exports = Profile
