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
  afterEach(function() {
    instanceLayer.cleanup()
    instanceLayer = null
  })
  describe("one associated document", function() { 
    it("should be created if it doesn't exist", function(done) {
      var user = User.create({"name": "Zach Smith"}, function() {
        user.assoc("profile", function(profile) {
          Profile.findOne({ userId: user.get("_id") }, function(prof) {
            prof.get("_id").should.equal(profile.get("_id"))
            done()
          })
        })
      })
    })
    it("should be found if it does exist", function(done) {
      var user = User.create({"name": "Zach Smith"}, function() {
        Profile.create({ userId: user.get("_id"), realName: "asdfasdfs" }, function() {
          User.findOne(user.get("_id"), function(profile) {
            var profile = user.assoc("profile", function() {
              var prof = Profile.findOne({ userId: user.get("_id") }, function() {
                profile.get("_id").should.equal(prof.get("_id"))
                prof.get("realName").should.equal(profile.get("realName"))
                done()
              })
            })
          })
        })
      })
    })
  })
})
