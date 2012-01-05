var EventEmitter  = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , LiveDocumentMongo = require("../lib/drivers/mongodb/live_document_mongo")
  , assert        = require("assert")
  , Mongolian     = require("mongolian")

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
 
  describe("created with define", function() {
    it("should have the correct constructor methods", function() {
      Thing.create.should.be.a("function")
      Thing.read.should.be.a("function")
      Thing.update.should.be.a("function")
      Thing.delete.should.be.a("function")
    })
    // we'll just test a few
    it("should have the correct prototype methods", function(done) {
      var thing = new Thing
      thing.set.should.be.a("function")
      thing.get.should.be.a("function")
      thing.save.should.be.a("function")

      Thing.create({title: "w0000t"}, function() {
        Thing.read({}, function(things) {
          things.at(0).get("title").should.equal("w0000t")
          done()
        })
      })
    }) 
  })
})

