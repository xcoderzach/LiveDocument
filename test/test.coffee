{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"

describe "LiveDocument", ->
  class Thing extends LiveDocument
    @socket = new EventEmitter()
  describe ".read()", ->
    describe "with no conditions", ->
      it "should send a read message",  ->
        Thing.socket.on "LiveDocumentRead", (name, query, requestNumber) ->
          name.should.equal "things"
          query.should.eql {}
          # if we actually test the number it'll make our tests fragile
          # b/c we can't reorder or insert new tests
          (typeof requestNumber).should.equal "number"

        Thing.read()
      it "should call the load event when it gets the results", ->

