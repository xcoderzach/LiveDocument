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
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.socket = socket
    liveDocumentMongo.setSocket(socket)
    db.collection("things").remove {}, (err) ->
      done()

  describe "instances", ->
    describe ".set", ->
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
