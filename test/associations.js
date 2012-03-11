var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , LiveDocumentMongo = require("../lib/drivers/mongodb/live_document_mongo")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , User              = require("./models/user")
  , Profile           = require("./models/profile")

//setup the hasOne association

describe("LiveDocument", function() {
  var liveDocumentMongo
  beforeEach(function(done) {
    var socket = new EventEmitter

    liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

    User.setSocket(socket)
    Profile.setSocket(socket)

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
          Profile.findByKey("userId", user.get("_id"), function(prof) {
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
