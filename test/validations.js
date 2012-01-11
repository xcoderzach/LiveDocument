var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , LiveDocumentMongo = require("../lib/drivers/mongodb/live_document_mongo")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")

  , db = new Mongolian("localhost/LiveDocumentTestDB")


var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140, required: true })
  .key("unique", { unique: true })


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
        invalidFields.should.eql({ "title": ["short"] })
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
        invalidFields.should.eql({ "title": ["short"] })
        done()
      })
      thing.validate()
    })
    it("should call a callback with the invalid fields", function(done) {
      var thing = new Thing({title: "a", description: "herp derp"})
      //first arg should be an instance
      thing.validate(function(thing, invalidFields) {
        invalidFields.should.eql({ "title": ["short"] })
        done()
      }) 
    })
  })
  describe("when the validation method is server only", function() {
    it("should be called on the server", function(done) {
      Thing.create({title: "asdasf", description: "herp derp", unique: "derp"}, function() {
        var thing = Thing.create({title: "asdfasd", description: "herp derp", unique: "derp"})
        thing.on("error", function(thing, errors) {
          errors.should.eql({"unique": ["unique"]})
          done()
        })
      })
    })
  })
})
