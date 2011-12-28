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
 
  describe "collections", ->
    describe ".at()", ->
      it "should return the item at index given", (done) ->
        Thing.create { title: "w000t" }, ->
          Thing.create { title: "w000t2" }, ->
            things = Thing.read {}, ->
              things.at(0).get("title").should.equal "w000t"
              things.at(1).get("title").should.equal "w000t2"
              done()
    describe ".get()", ->
      it "should return the item with given id", (done) ->
        Thing.create { title: "w000t" }, (thing1) ->
          Thing.create { title: "w000t2" }, (thing2) ->
            id1 = thing1.get("_id")
            id2 = thing2.get("_id")
            things = Thing.read {}, ->
              things.get(id1).get("title").should.equal "w000t"
              things.get(id2).get("title").should.equal "w000t2"
              done()
    describe ".sortBy()", ->
      describe "when given a field name", ->
        it "should put the elements in sorted order", (done) ->
          Thing.create { title: "derp", priority: 10 }, ->
            Thing.create { title: "herp", priority: 100 }, ->
              Thing.create { title: "herp", priority: 50 }, ->
                things = Thing.read({}).sortBy "priority"
                things.on "load", () ->
                  things.at(0).get("priority").should.equal 10
                  things.at(1).get("priority").should.equal 50
                  things.at(2).get("priority").should.equal 100
                  done()
              
          
        it "should emit a clear event whenever sortBy() is called on a non-empty collection"
        it "should insert new elements into correct position"
        it "should move updated elements into correct position"
      describe "when given a key and a direction", ->
        it "should put the elements in sorted order"
        it "should emit a clear event whenever sortBy() is called on a non-empty collection"
        it "should insert new elements into correct position"
