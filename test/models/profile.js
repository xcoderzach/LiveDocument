var LiveDocument = require("../../lib/document")

var Profile = LiveDocument.define("Profile")
  .key("realName")
  .key("first")
  .key("last")
  .getKey("fullName", ["first", "last"], function() {
    return this.get("first") + " " + this.get("last")
  })
  .setKey("fullName", function(val) {
    var name = val.split(" ")
    this.set("first", name[0])
    this.set("last", name[1])
  })

module.exports = Profile
