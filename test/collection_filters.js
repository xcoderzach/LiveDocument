var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
  , LiveDocumentMongo = require("../lib/server")
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
