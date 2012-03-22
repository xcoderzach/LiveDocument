var EventEmitter      = require("events").EventEmitter
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , Document          = require("../lib/document")
  , socket            = new EventEmitter
Document.setSocket(socket) 
  , db = new Mongolian("localhost/LiveDocumentTestDB")

delete require.cache[require.resolve("./models/thing")]
var Thing = require("./models/thing")
delete require.cache[require.resolve("./models/thing")]

var liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)

describe("LiveDocument", function() {
  beforeEach(function(done) {
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
