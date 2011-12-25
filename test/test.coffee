{ EventEmitter } = require("events")
LiveDocument = require("../index.coffee")


socket = null
resetSocket = () ->
  socket = LiveDocument.socket = new EventEmitter()


Thing = null
describe "LiveDocument", ->
  beforeEach ->
    resetSocket()
  class Thing extends LiveDocument
  describe ".read()", ->
    describe "with no conditions", ->
      it "should send a read message",  ->
        socket.on "LiveDocumentRead", () ->
          console.log(arguments)
        Thing.read()
      it "should call the load event when it gets the results", ->

