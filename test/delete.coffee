{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"
_                     = require "underscore"

db = new Mongolian("localhost/LiveDocumentTestDB")

class Thing extends LiveDocument

  @socket = new EventEmitter

  @key "title", { length: [3...24], required: true }
  @key "description", { max: 140 }

liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)

describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo.setSocket(socket)
    db.collection("things").remove {}, (err) ->
      done()

  describe ".delete()", ->

    it "should remove the item", (done) ->
      Thing.create {title: "herp", description: "derp"}, (thing) ->
        Thing.delete {_id: thing.get("_id")}, ->
          Thing.read {_id: thing.get("_id")}, (things) ->
            things.length.should.equal 0
            done()

    it "should send a delete notification to another instance of the same item", (done) ->
      thing = Thing.create {title: "herp", description: "derp"}
      thing.on "delete", (thing) ->
        thing.deleted.should.equal true
        done()
      Thing.delete {_id: thing.get("_id")}

    it "should send a remove notification to collections that contain that item", (done) ->
      Thing.create {title: "herp", description: "derp"}, (thing) ->
        things = Thing.read {}, ->
          things.length.should.equal 1
        things.on "remove", ->
          things.length.should.equal 0
          done()
        Thing.delete {_id: thing.get("_id")}
