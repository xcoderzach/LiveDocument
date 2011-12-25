{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"

describe "LiveDocument", ->
  class Thing extends LiveDocument
    @socket = new EventEmitter()
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    Thing.socket = new EventEmitter()
  describe ".read()", ->
    describe "with no conditions", ->
      it "should send a read message",  ->
        Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
          name.should.equal "things"
          query.should.eql {}
          # if we actually test the number it'll make our tests fragile
          # b/c we can't reorder or create new tests
          (typeof requestNumber).should.equal "number"
        Thing.read()
      it "should call the load event when it gets the results", ->
        expected  = [ {title: "A title", description: "w00t describing"}
                    , {title: "A title 2", description: "w00t describing 2"} ]
        Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
          process.nextTick ->
            Thing.socket.emit "LiveDocument" + requestNumber, expected, "load"
        things = Thing.read()
        things.on "load", (docs) ->
          docs.should.equal expected

