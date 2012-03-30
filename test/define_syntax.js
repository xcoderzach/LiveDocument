var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db = new Mongolian("localhost/LiveDocumentTestDB")
  , socket                = new EventEmitter
  , Document              = require("../lib/document")
Document.setSocket(socket)  

delete require.cache[require.resolve("./models/thing")]

var Thing                 = require("./models/thing")
Thing.isServer = false

delete require.cache[require.resolve("./models/thing")]

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

