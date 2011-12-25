{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"

echoRead = (Document, expected) ->
  Document.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
    process.nextTick ->
      Document.socket.emit "LiveDocument" + requestNumber, expected, "load"

describe "LiveDocument", ->
  class Thing extends LiveDocument
    @socket = new EventEmitter()
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
        echoRead(Thing, expected)
        things = Thing.read()
        things.on "load", (docs) ->
          docs.should.equal expected
          done()

      it "should set the loaded attribute on the collection", (done) ->
        expected  = [ {title: "A title", description: "w00t describing"} ]
        echoRead(Thing, expected)
        things = Thing.read()
        things.loaded.should.equal false
        things.on "load", ->
          things.loaded.should.equal true
          done()


