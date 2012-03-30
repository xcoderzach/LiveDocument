var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
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

//setup the hasOne association

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
  describe("when I filter a collection", function() {
    it("should remove things that don't pass the filter", function(done) {
      Profile.create({ first: "Zach", last: "Smith" }, function(profile) {
        Profile.create({ first: "Mach", last: "Sith" }, function(profile) {
          Profile.create({ first: "Jack", last: "Smit" }, function(profile) {
            Profile.find({}, function(profiles) {
              profiles.filter(function(profile) {
                var first = profile.get("first")
                return first.charAt(first.length - 1) === "h"
              })
              profiles.length.should.equal(2)
              profiles.at(0).get("first").should.equal("Zach")
              profiles.at(1).get("first").should.equal("Mach")
              done()
            })
          })
        })
      })
    })
  })
})
