var EventEmitter      = require("events").EventEmitter
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , Document          = require("../lib/document")
  , socket            = new EventEmitter
Document.setSocket(socket) 

delete require.cache[require.resolve("./models/user")]
delete require.cache[require.resolve("./models/profile")]

var User              = require("./models/user")
  , Profile           = require("./models/profile")
  , liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

User.isServer = false
Profile.isServer = false

delete require.cache[require.resolve("./models/user")]
delete require.cache[require.resolve("./models/profile")]


describe("LiveDocument", function() {
  beforeEach(function(done) {
    db.collection("users").remove({}, function(err) {
      db.collection("profiles").remove({}, function(err) {
        done()
      })
    })
  })
  afterEach(function() {
    liveDocumentMongo.cleanup()
  })
  describe("one associated document", function() { 
    it("should be created if it doesn't exist", function(done) {
      var user = User.create({"name": "Zach Smith"}, function() {
        user.assoc("profile", function(profile) {
          profile.save(function() {
            Profile.findByKey("userId", user.get("_id"), function(prof) {
              prof.get("_id").should.equal(profile.get("_id"))
              done()
            })
          })
        })
      })
    })
    it("should be found if it does exist", function(done) {
      var user = User.create({"name": "Zach Smith"}, function() {
        Profile.create({ userId: user.get("_id"), realName: "asdfasdfs" }, function() {
          User.findOne(user.get("_id"), function(profile) {
            var profile = user.assoc("profile", function() {
              var prof = Profile.findByKey("userId", user.get("_id"), function() {
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
