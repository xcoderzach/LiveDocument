{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")

class Thing extends LiveDocument

  @modelName = "Thing"
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


  describe ".read()", ->

    describe "with a query", ->
      it "should read a document", (done) ->
        document = { title: "I'm a title", description: "description" }
        Thing.create document, (t)->
          Thing.read {title: "I'm a title"}, (things) ->
            things.at(0).get("description").should.equal document.description
            things.at(0).get("title").should.equal document.title
            done()

    describe "without a query", ->
      it "should call the callback event with multiple results", (done) ->
        expected = [ {title: "A title", description: "w00t describing"}
                   , {title: "A title 2", description: "w00t describing 2"}]
        Thing.create expected[0], ->
          Thing.create expected[1], ->
            things = Thing.read {}, (docs) ->
              process.nextTick ->
                docs.at(0).get("title").should.equal expected[0].title
                docs.at(0).get("description").should.equal expected[0].description
 
                docs.at(1).get("title").should.equal expected[1].title
                docs.at(1).get("description").should.equal expected[1].description
                done()
 
 
      it "should set the loaded attribute on the collection", (done) ->
        expected = {title: "A title", description: "w00t describing"}
        Thing.create expected
        things = Thing.read {}, (thngs) ->
 
          things.should.equal thngs
 
          thngs.loaded.should.equal true
          thngs.should.equal(thngs)
          done()
 
      it "should fire the load event on the collection", (done) ->
        expected = {title: "A title", description: "w00t describing"}
        Thing.create expected
        things = Thing.read {}
        things.loaded.should.equal false
        things.on "load", (thngs) ->
 
          things.should.equal thngs
 
          things.should.equal(thngs)
          things.loaded.should.equal true
          done()
 
  describe "find()", ->
    it "should just alias read()", ->
      Thing.find.should.equal(Thing.read)
 
  describe "findOne()", ->
    it "should find by id when given just a string", (done) ->
      t = Thing.create {title: "w000t"}, ->
        Thing.findOne t.get("_id"), (thing) ->
          thing.get("title").should.equal "w000t"
          done()
  describe "all()", ->
    it "should find all the things"
