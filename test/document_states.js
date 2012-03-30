var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
  , assert            = require("assert")
  , LiveDocumentMongo = require("../lib/server")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , socket            = new EventEmitter
  , Document          = require("../lib/document")

Document.setSocket(socket)  

var Thing             = require("./models/thing")
Thing.isServer = false
var liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")
describe("LiveDocument", function() {
  beforeEach(function(done) {
    db.collection("things").remove({}, function(err) {
      done()
    })
  }) 
  afterEach(function() {
    liveDocumentMongo.cleanup()
  })

  describe(".load method", function() {
    it("should be called once the document loads", function(done) {
      Thing.create({title: "Herp Derp"}, function(t) {
        var id = t.get("_id")
          , thing = Thing.findOne(id)

        thing.load(function() {
          thing.get("title").should.equal("Herp Derp")
          thing.loaded.should.equal(true)

          done()
        })
      })
    })
    it("should be called if the document is already loaded", function(done) {
      Thing.create({title: "Herp Derp"}, function(t) {
        var id = t.get("_id")
          , thing = Thing.findOne(id, function() {

          process.nextTick(function() {
            thing.load(function() {
              thing.get("title").should.equal("Herp Derp")
              thing.loaded.should.equal(true)
              done()
            })
          })

        })
      }) 
    })
  })

  describe("load event", function() {
    it("should be called once the document loads", function(done) {
      Thing.create({title: "Herp Derp"}, function(t) {
        var id = t.get("_id")
          , thing = Thing.findOne(id)

        thing.on("load", function() {
          thing.get("title").should.equal("Herp Derp")
          thing.loaded.should.equal(true)
          done()
        })
      })
    }) 
  }) 

  describe("loaded attribute", function() {
    it("should be set for items in collection", function(done) {
      Thing.create({title: "Herp Derp"}, function(t) {
        Thing.find({}, function(things) {
          things.at(0).loaded.should.equal(true)
          done()
        })
      })
    })

  })
  describe("persisted attribute", function() {
    it("should be set for items in collection", function(done) {
      Thing.create({title: "Herp Derp"}, function(t) {
        t.persisted.should.equal(true)
        Thing.find({}, function(things) {
          things.at(0).persisted.should.equal(true)
          done()
        })
      })
    })
  })
})
