var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")

  , db = new Mongolian("localhost/LiveDocumentTestDB")


var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140, required: true })
  .key("unique", { unique: true })


Thing.socket = new EventEmitter

   
describe("LiveDocument", function() {
  var liveDocumentMongo
  beforeEach(function(done) {
    var socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)
    liveDocumentMongo.setSocket(socket)
    db.collection("things").remove({}, function(err) {
      done()
    })
  }) 
  afterEach(function() {
    liveDocumentMongo.cleanup()
  })
  describe("with an invalid title", function() {
    it("should not save", function(done) {
      var thing = Thing.create({title: "a", description: "herp derp"}, function() {
        done(new Error("Callback should not be called"))
      })
      thing.on("invalid", function(thing, invalidFields) {
        invalidFields.should.eql({ "title": ["short"] })
        Thing.find({}, function(things) {
          things.length.should.equal(0)
          done()
        })
      })
    })
  })
  describe("when the validate method is called", function() {
    it("should emit an error when the document is invalid", function(done) {
      var thing = new Thing({title: "a", description: "herp derp"})
      thing.on("invalid", function(thing, invalidFields) {
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
  describe("when the validateField method is called", function() {
    it("should emit an error event when the field is invalid", function(done) {
      var thing = new Thing({title: "a", description: "herp derp"})
      thing.on("invalid:title", function(thing, errors) {
        errors.should.eql(["short"])
        done()
      })
      thing.validateField("title")
    })
    it("should call a callback with the error messages", function(done) {
      var thing = new Thing({title: "a", description: "herp derp"})
      //first arg should be an instance
      thing.validateField("title", function(thing, messages) {
        messages.should.eql(["short"])
        done()
      }) 
    })
  }) 
})
