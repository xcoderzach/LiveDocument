{ EventEmitter }      = require "events"
LiveDocumentMongo     = require "../lib/server"
assert                = require "assert"
Mongolian             = require "mongolian"
Document              = require "../lib/document"
socket                = new EventEmitter

Document.setSocket(socket) 
Thing                 = require "./models/thing"
Thing.isServer = false

delete require.cache[require.resolve("./models/thing")]

db = new Mongolian("localhost/LiveDocumentTestDB")

liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    db.collection("things").remove {}, (err) ->
      done()
  afterEach ->
    liveDocumentMongo.cleanup()
 
  describe "instances", ->
    describe ".set()", ->
      it "should update the value", (done) ->
        thing = Thing.create {title: "w00t", description: "woo hooo"}, (thing) ->
          thing.set("title", "b00t")
          thing.get("title").should.equal "b00t"
          done()

      it "should enumerate objects", (done) ->
        thing = Thing.create {title: "w00t", description: "woo hooo"}, (thing) ->
          thing.set({title: "b00t", description: "boo hooo"})
          thing.get("title").should.equal "b00t"
          thing.get("description").should.equal "boo hooo"
          done()
      
      # This test brings up the interesting world of merging!
      # on("conflict")?
      it "should not get its value overwritten by an incoming update"

      it "should be saved when save is called", (done) ->
        thing = new Thing
        self = thing.set {title: "w000t", description: "My Description"}
        #ensure chainability
        thing.should.equal self
        self = thing.save ->
          thing.get("title").should.equal "w000t"
          thing.get("description").should.equal "My Description"
          done()
        thing.should.equal self

      it "should fire change events for the attributes on the document instance that changed on set", (done) ->
        actualThing = Thing.create({title: "w00t", description: "woo hooo"})
        id = actualThing.get("_id")
        copyOfThing = Thing.find {_id: id}, () ->

          actualThing.on "change:title", (val, oldVal, thing) ->
            val.should.equal "newTitle"
            oldVal.should.equal "w00t"
            thing.get("title").should.equal "newTitle"
            done()
            
          actualThing.set {title: "newTitle"}

    describe ".get()", ->
      it "should return the value", (done) ->
        thing = Thing.create {title: "w00t", description: "woo hooo"}, ->
          done()
        thing.get("title").should.equal "w00t"
