{ EventEmitter }      = require "events"
LiveDocument          = require "../lib/document"
LiveDocumentMongo     = require "../lib/server"
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

liveDocumentMongo = new LiveDocumentMongo(socket, db, "../../../test/models")

describe "LiveDocument", ->
  beforeEach (done) ->
    db.collection("things").remove (err) ->
      done()
  afterEach ->
    liveDocumentMongo.cleanup()
    

  describe ".delete()", ->

    it "should remove the item", (done) ->
      Thing.create {title: "herp", description: "derp"}, (thing) ->
        thing.remove ->
          Thing.find {_id: thing.get("_id")}, (things) ->
            things.length.should.equal 0
            done()

    it "should send a remove notification to collections that contain that item", (done) ->
      Thing.create {title: "herp", description: "derp"}, (thing) ->
        things = Thing.find {}, ->
          things.length.should.equal 1
          things.at(0).remove()
        things.on "remove", ->
          things.length.should.equal 0
          done()
    it "should fire a deleting event"

  describe ".remove() instance", ->
    it "should remove the document", (done) ->
      Thing.create {title: "herp", description: "derp"}, (thing) ->
        thing.remove ->
          thing.deleted.should.equal true
          Thing.find { _id: thing.get("_id") }, (things) ->
            things.length.should.equal(0)
            done()
