{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"
assert           = require "assert"
 
echoRead = (expected) ->
  Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
    process.nextTick ->
      Thing.socket.emit "LiveDocument" + requestNumber, expected, "load"

changeAfterRead = (expected, newDoc, method) ->
  Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
    process.nextTick ->
      Thing.socket.emit "LiveDocument" + requestNumber, expected, "load"
      process.nextTick ->
        Thing.socket.emit "LiveDocument" + requestNumber, newDoc, method
 
class Thing extends LiveDocument
  @socket = new EventEmitter()

  @key "title", { length: [3...24] }
  @key "description", { max: 140, required: true }

 
describe "LiveDocument", ->
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    Thing.socket = new EventEmitter()

  describe ".read()", ->
    describe "with no conditions", ->

      it "should send a read message", (done) ->
        Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
          name.should.equal "things"
          query.should.eql {}
          # if we actually test the number it'll make our tests fragile
          # b/c we can't reorder or create new tests
          (typeof requestNumber).should.equal "number"
          done()
        Thing.read()


      it "should call the load event when it gets the results", (done) ->
        expected  = [ {title: "A title", description: "w00t describing"}
                    , {title: "A title 2", description: "w00t describing 2"} ]
        echoRead(expected)
        things = Thing.read()
        things.on "load", (docs) ->
          docs.at(0).get("title").should.equal expected[0].title
          docs.at(0).get("description").should.equal expected[0].description

          docs.at(1).get("title").should.equal expected[1].title
          docs.at(1).get("description").should.equal expected[1].description
          done()
  

      it "should fire an insert event when a document is inserted"
      it "should fire a remove event when a document is removed"


      it "should set the loaded attribute on the collection", (done) ->
        expected = [ {title: "A title", description: "w00t describing"} ]
        echoRead(expected)
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
   
