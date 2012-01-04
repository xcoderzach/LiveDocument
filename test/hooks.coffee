{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


Thing = null
liveDocumentMongo = new LiveDocumentMongo(new EventEmitter, db)

describe "LiveDocument", ->
  beforeEach (done) ->
    class Thing extends LiveDocument

      @modelName = "Thing"
      @socket = new EventEmitter

      @key "title", { length: [3...24] }
      @key "description", { max: 140, required: true }
     
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
    it "the model should not save if the hook passes something and fire an error event", (done) ->
      Thing.beforeSave (notOk) ->
        notOk("derp")
      thing = new Thing {title: "w00t"}
      thing.on "error", (err) ->
        err.should.equal("derp")
        done()
      thing.save ->
        done("This shouldn't happen")

    it "should pass the thing in and also bind to this", (done) ->
      thing = new Thing {title: "w00t"}
      Thing.beforeSave (ok, t) ->
        @.should.equal(t).and.equal(thing)
        ok()
      thing.save ->
        done()
