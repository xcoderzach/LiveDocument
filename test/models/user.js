var LiveDocument = require("../../index")

module.exports = function() {

  var User = LiveDocument.define("User")
    .key("name", { length: [3,24] })
    .key("job", { max: 140 })
    .editableBy("self")

  return User 
}
