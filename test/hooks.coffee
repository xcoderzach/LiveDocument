{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


class Thing extends LiveDocument

  @socket = new EventEmitter

  @key "title", { length: [3...24] }
  @key "description", { max: 140, required: true }

liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)

describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo.setSocket(socket)
    db.collection("things").remove {}, (err) ->
      done()
 

  describe "beforeSave hook", () ->
    it "should be run before a model is saved and save if nothing is passed", (done) ->
      Thing.beforeSave (ok) ->
        ok()
      thing = new Thing {title: "w00t"}
      thing.save ->
        done()
    it "the model should not save if the hook passes something"
    it "should pass the thing in and also bind to this"
