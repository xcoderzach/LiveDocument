var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , assert            = require("assert")
  , InstanceLayer     = require("../lib/drivers/mongodb/instance_layer")
  , Mongolian         = require("mongolian")

  , db = new Mongolian("localhost/LiveDocumentTestDB")


var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140 })


Thing.socket = new EventEmitter
   
describe("LiveDocument", function() {
  var instanceLayer
  beforeEach(function(done) {
    var socket = new EventEmitter

    Thing.socket = socket
    instanceLayer = new InstanceLayer(socket, db, __dirname + "/models")

    db.collection("things").remove({}, function(err) {
      done()
    })
  }) 
  afterEach(function() {
    instanceLayer.cleanup()
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
