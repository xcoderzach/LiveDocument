{ EventEmitter }      = require "events"
LiveDocument          = require "../index"
InstanceLayer         = require "../lib/drivers/mongodb/instance_layer"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


class Thing extends LiveDocument

  @modelName = "Thing"
  @socket = new EventEmitter

  @key "title", { length: [3...24] }
  @key "description", { max: 140 }

describe "LiveDocument", ->
  instanceLayer = null
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.setSocket socket
    instanceLayer = new InstanceLayer(socket, db, __dirname + "/models")
    db.collection("things").remove {}, (err) ->
      done()
  afterEach ->
    instanceLayer.cleanup()
 
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
          
        it "should insert new elements into correct position", (done) ->
          Thing.create { title: "derp", priority: 10 }, ->
            Thing.create { title: "herp", priority: 100 }, ->
              Thing.create { title: "herp", priority: 50 }, ->
                things = Thing.read({}).sortBy "priority"
                things.on "load", () ->
                  Thing.create { title: "derp", priority: 25 }, ->
                    Thing.create { title: "herp", priority: 75 }, ->
                      things.at(0).get("priority").should.equal 10
                      things.at(1).get("priority").should.equal 25
                      things.at(2).get("priority").should.equal 50
                      things.at(3).get("priority").should.equal 75
                      things.at(4).get("priority").should.equal 100
                      done()
           
        it "should move updated elements into correct position", (done) ->
          Thing.create { title: "derp", priority: 10 }, ->
            Thing.create { title: "herp", priority: 100 }, ->
              Thing.create { title: "herp", priority: 50 }, ->
                things = Thing.read({}).sortBy "priority"
                things.on "load", () ->
                  things.at(1).set {priority: 150}
                  things.at(0).get("priority").should.equal 10
                  things.at(1).get("priority").should.equal 100
                  things.at(2).get("priority").should.equal 150

                  things.length.should.equal(3)
                  done()
      describe "when given a function", ->
        it "should put the elements in sorted order"
