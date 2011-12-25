{ EventEmitter } = require("events")
LiveDocument = require("../index.coffee")

describe "LiveDocument", ->
  class Thing extends LiveDocument
    @socket = new EventEmitter()
  describe ".read()", ->
    describe "with no conditions", ->
      it "should send a read message",  ->
        Thing.socket.on "LiveDocumentRead", () ->
          console.log(arguments)
        Thing.read()
      it "should call the load event when it gets the results", ->

