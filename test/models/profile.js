var LiveDocument = require("../../index")

module.exports = function() {

  var Profile = LiveDocument.define("Profile")
    .key("realName")
 
  return Profile
}
