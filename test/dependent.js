var EventEmitter      = require("events").EventEmitter
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , Document          = require("../lib/document")
  , socket            = new EventEmitter
Document.setSocket(socket) 

var User              = require("./models/user")
  , Profile           = require("./models/profile")
  , liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

delete require.cache[require.resolve("./models/user")]
delete require.cache[require.resolve("./models/profile")]

User.isServer = false
Profile.isServer = false

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
  describe("a dependent has one associations", function() {
    it("should be deleted when the parent is deleted", function(done) {
      User.create({ name: "mah name" }, function(user) {
        user.assoc("profile", function(profile) {
          profile.save(function() {
            user.remove()
            profile.on("delete", function() {
              done()
            })
          })
        })
      })
    })
  })
}) 
