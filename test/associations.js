var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , InstanceLayer     = require("../lib/drivers/mongodb/instance_layer")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , User              = require("./models/user.js")()
  , Profile           = require("./models/profile.js")()

//setup the hasOne association
User.one(Profile)

describe("LiveDocument", function() {
  var instanceLayer
  beforeEach(function(done) {
    var socket = new EventEmitter

    instanceLayer = new InstanceLayer(socket, db, __dirname + "/models")

    User.setSocket(socket)
    Profile.setSocket(socket)

    db.collection("users").remove({}, function(err) {
      db.collection("profiles").remove({}, function(err) {
        done()
      })
    })
  })
  describe("one associated document", function() { 
    it("should be created if it doesn't exist", function(done) {
      var user = User.create({"name": "Zach Smith"}, function() {
        user.assoc("profile", function(profile) {
          user.assoc("profile").save(function() {
            var prof = Profile.findOne({ userId: user.get("_id") }, function() {
              prof.get("_id").should.equal(profile.get("_id"))
              done()
            })
          })
        })
      })
    })
  })
})
