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
  describe("a dynamic key", function() {
    it("should return the value on .get()", function(done) {
      Profile.create({ first: "Zach", last: "Smith" }, function(profile) {
        profile.get("fullName").should.equal("Zach Smith")
        done()
      })
    })
    it("should have a change notification when we change a component", function(done) {
      Profile.create({ first: "Zach", last: "Smith" }, function(profile) {
        profile.on("change:fullName", function() {
          this.get("fullName").should.equal("Zack Smith")
          done()
        })
        profile.set({ first: "Zack"})
        profile.save()
      })
    })
    it("should set the values", function(done) {
      Profile.create({ fullName: "Zach Smith" }, function(profile) {
        try {
        profile.get("fullName").should.equal("Zach Smith")
        profile.get("first").should.equal("Zach")
        profile.get("last").should.equal("Smith")
        done()
        } catch(e) {
          console.log(e)
        }
      })
    })
  })
})
