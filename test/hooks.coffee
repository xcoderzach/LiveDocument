{ EventEmitter }      = require "events"
LiveDocument          = require "../index"
LiveDocumentMongo         = require "../lib/drivers/mongodb/live_document_mongo"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


getThing = () ->
  class Thing extends LiveDocument
    @modelName = "Thing"
    @socket = new EventEmitter

    @key "title", { length: [3...24] }
    @key "description", { max: 140 }

Thing = getThing()
describe "LiveDocument", ->
  liveDocumentMongo = null
  beforeEach (done) ->
    Thing = getThing()
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.setSocket socket
    liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")
    db.collection("things").remove {}, (err) ->
      done()

  afterEach ->
   liveDocumentMongo.cleanup()
 
  describe "beforeSave hook", () ->
    it "should be run before a model is saved and save if nothing is passed", (done) ->
      Thing.beforeSave (thing, ok) ->
        ok()
      thing = new Thing {title: "w00t"}
      thing.save ->
        done()
    it "the model should not save if the hook passes something and fire an error event", (done) ->
      Thing.beforeSave (thing, notOk) ->
          notOk("derp")
      Thing.isServer = false
      thing = new Thing {title: "w00t"}
      thing.on "error", (err) ->
        err.should.equal("derp")
        process.nextTick ->
          done()
      thing.save ->
        done("This shouldn't happen")
   
    it "should pass the thing in and also bind to this", (done) ->
      thing = new Thing {title: "w00t"}
      Thing.beforeSave (t, ok) ->
        @.should.equal(t).and.equal(thing)
        ok()
      thing.save ->
        done()
  describe "serverBeforeSaveHook", () ->
    it "should run on the server", (done) ->
      Thing.serverBeforeSave (thing, ok) ->
        done()

      Thing.create {title: "herp"}, () ->
        done(new Error("shouldn't save"))

    it "should not run on the client", (done) ->
      Thing.isServer = false
      Thing.serverBeforeSave (thing, ok) ->
        done(new Error("serverBeforeSave called on client"))

      Thing.create {title: "herp"}, () ->
        done()
