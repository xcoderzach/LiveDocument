{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"

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


  describe ".read()", ->

    describe "with a query", ->
      it "should read a document", (done) ->
        document = {title: "I'm a title", description: "description"}
        Thing.create document, ->
          Thing.read {title: "I'm a title"}, (things) ->
            # send it to the next tick because mongolian swallows our
            # assertions
            process.nextTick ->
              things.at(0).get("title").should.equal document.title
              things.at(0).get("description").should.equal document.description
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


      it "should fire an insert event when a document is inserted"
      it "should fire a remove event when a document is removed"

      it "should set the loaded attribute on the collection", (done) ->
        expected = {title: "A title", description: "w00t describing"}
        Thing.create expected
        doneTimes = 0
        things = Thing.read {}, (thngs) ->
          things.loaded.should.equal true
          things.should.equal(thngs)
          doneTimes += 1
          if doneTimes == 2
            done()

        things.loaded.should.equal false
        things.on "load", (thngs) ->
          things.should.equal(thngs)
          things.loaded.should.equal true
          doneTimes += 1
          if doneTimes == 2
            done()