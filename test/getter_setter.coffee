{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


class Thing extends LiveDocument
  @modelName = "Thing"

  @socket = new EventEmitter

  @key "title", { length: [3, 24] }
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

  describe "instances", ->
    describe ".set()", ->
      it "should update the value", ->
        thing = Thing.create({title: "w00t", description: "woo hooo"})
        thing.set("title", "b00t")
        thing.get("title").should.equal "b00t"

      it "should enumerate objects", ->
        thing = Thing.create({title: "w00t", description: "woo hooo"})
        thing.set({title: "b00t", description: "boo hooo"})
        thing.get("title").should.equal "b00t"
        thing.get("description").should.equal "boo hooo"
      
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
        copyOfThing = Thing.read({_id: id})

        actualThing.on "change:title", (val, oldVal, thing) ->
          val.should.equal "newTitle"
          oldVal.should.equal "w00t"
          thing.get("title").should.equal "newTitle"
          done()
          
        copyOfThing.on "change:title", (thing) ->
          test.fail("this shouldn't be called until the thing has been saved")
          done()

        actualThing.set {title: "newTitle"}

      it "should fire change events for the attributes on the document instance that changed on set", ->
        actualThing = Thing.create({title: "w00t", description: "woo hooo"})
        id = actualThing.get("_id")
        copyOfThing = Thing.read({_id: id})

        actualThing.on "change:title", (val, oldVal, thing) ->
          val.should.equal "newTitle"
          oldVal.should.equal "w00t"
          thing.get("title").should.equal "newTitle"
          
        copyOfThing.on "change:title", (val, oldVal, thing) ->
          val.should.equal "newTitle"
          oldVal.should.equal "w00t"
          thing.get("title").should.equal "newTitle"
          done()

        actualThing.set {title: "newTitle"}
        actualThing.save()
 
      it "should not infinite loop on nested set calls"
    describe ".get()", ->
      it "should return the value", ->
        thing = Thing.create {title: "w00t", description: "woo hooo"}
        thing.get("title").should.equal "w00t"

      #this is actually questionable, since there would be no way to "unbind"
      it "when passed with a function as the second parameter get should call it with the value on load and update"
