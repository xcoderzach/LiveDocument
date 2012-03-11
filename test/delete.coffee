{ EventEmitter }      = require "events"
LiveDocument          = require "../index"
LiveDocumentMongo         = require "../lib/drivers/mongodb/live_document_mongo"
ChangeDispatch        = require "../lib/drivers/mongodb/change_dispatch"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


class Thing extends LiveDocument

  @modelName = "Thing"
  @socket = new EventEmitter

  @key "title", { length: [3...24] }
  @key "description", { max: 140 }

describe "LiveDocument", ->
  liveDocumentMongo = null
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.setSocket socket
    ChangeDispatch.globalQueryListeners = []

    liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")
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
