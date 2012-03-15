var EventEmitter  = require("events").EventEmitter
  , LiveDocument  = require("../lib/document")
  , LiveDocumentMongo = require("../lib/server")
  , assert        = require("assert")
  , Mongolian     = require("mongolian")

  , db = new Mongolian("localhost/LiveDocumentTestDB")

var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140 })

Thing.socket = new EventEmitter
   
describe("LiveDocument", function() {
  var liveDocumentMongo
  beforeEach(function(done) {
    var socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")
    db.collection("things").remove({}, function(err) {
      done()
    })
  })
  afterEach(function(done) {
    liveDocumentMongo.cleanup()
    process.nextTick(function() {
      done()
    })
  })
 
  describe("created with define", function() {
    it("should have the correct constructor methods", function() {
      Thing.create.should.be.a("function")
      Thing.find.should.be.a("function")
    })
    // we'll just test a few
    it("should have the correct prototype methods", function(done) {
      var thing = new Thing
      thing.set.should.be.a("function")
      thing.get.should.be.a("function")
      thing.save.should.be.a("function")

      Thing.create({title: "w0000t"}, function() {
        Thing.find({}, function(things) {
          things.at(0).get("title").should.equal("w0000t")
          done()
        })
      })
    }) 
  })
})

