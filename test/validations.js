var EventEmitter  = require("events").EventEmitter
  , LD            = require("../index")
  , assert        = require("assert")
  , Mongolian     = require("mongolian")


  , LiveDocument = LD.LiveDocument
  , LiveDocumentMongo = LD.LiveDocumentMongo
  , db = new Mongolian("localhost/LiveDocumentTestDB")


var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140, required: true })

Thing.socket = new EventEmitter
var liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)

   
describe("LiveDocument", function() {
  beforeEach(function(done) {
    var socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo.setSocket(socket)
    db.collection("things").remove({}, function(err) {
      done()
    })
  }) 
  describe("with an invalid title", function() {
    it("should not save", function(done) {
      var thing = Thing.create({title: "a", description: "herp derp"}, function() {
        done(new Error("Callback should not be called"))
      })
      thing.on("error", function(thing, invalidFields) {
        invalidFields.should.eql({ "title": ["too short"] })
        Thing.find({}, function(things) {
          things.length.should.equal(0)
          done()
        })
      })
    })
  })
  describe("when the validate method is called", function() {
    it("should emit an error", function(done) {
      var thing = new Thing({title: "a", description: "herp derp"})
      thing.on("error", function(thing, invalidFields) {
        invalidFields.should.eql({ "title": ["too short"] })
        done()
      })
      thing.validate()
    })
    it("should call a callback with the invalid fields", function() {
      var thing = new Thing({title: "a", description: "herp derp"})
      thing.validate(function(invalidFields) {
        invalidFields.should.eql({ "title": ["too short"] })
        done()
      }) 
    })
  })
})


