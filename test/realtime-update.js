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
  describe("updating a thing", function() {
    it("should realtime update", function (done) {
      Thing.create({ votes: 10, title: "title" }, function(thing) {
        var big = Thing.find({votes: {$gt:5} }, function() {
          big.length.should.equal(1)
        })
        var small = Thing.find({votes: {$lte:5} }, function() {
          small.length.should.equal(0)
          thing.set("votes", 1)
          thing.save()
        })
        small.on("insert", function() {
          small.length.should.equal(1)
          done()
        })
      })
    })
  })
})
 

