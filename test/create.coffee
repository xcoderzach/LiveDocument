{ EventEmitter }      = require "events"
LiveDocument          = require "../lib/document"
LiveDocumentMongo         = require "../lib/server"
assert                = require "assert"
Mongolian             = require "mongolian"
socket                = new EventEmitter
Document              = require "../lib/document"
Document.setSocket(socket) 

db = new Mongolian("localhost/LiveDocumentTestDB")

class Thing extends LiveDocument
  @modelName = "Thing"

  @key "title", { length: [3...24] }
  @key "description", { max: 140 }

liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    db.collection("things").remove {}, (err) ->
      done()
  afterEach ->
    liveDocumentMongo.cleanup()
 

  describe ".create()", ->
    describe "that is valid", ->
      it "should send a create message", (done) ->
        document = { title: "w00t", description: "w00t w00t" }
        Thing.create document, (doc) ->
          doc.get("title").should.eql document.title
          doc.get("description").should.eql document.description
          done()

      it "should generate an id for the document", ->
        document = { title: "w00t", description: "w00t w00t" }
        thing = Thing.create document
        (typeof thing.get("_id")).should.equal "string"

      it "should send an insert message to a collection to which it fits", (done) ->
        things = Thing.find {priority: {$lt: 10}}
        things.length.should.equal 0
        things.on "insert", ->
          things.length.should.equal 1
          done()
        Thing.create { title: "herp derp", priority: 5 }

      it "should not send an insert message to a collection to which it doesn't fits", (done) ->
        things = Thing.find {priority: {$lt: 10}}
        things.length.should.equal 0
  
        things.on "insert", ->
          assert.fail("shouldn't insert")

        Thing.create { title: "herp derp", priority: 11 }, ->
          process.nextTick ->
            things.length.should.equal 0
            done()
        

      it "should fire a saved event", (done) ->
        thing = Thing.create({ title: "herp derp", priority: 11 })
        thing.on "saved", (thing) ->
          thing.get("title").should.equal "herp derp"
          thing.get("priority").should.equal 11
          done()
