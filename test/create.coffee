{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"
assert           = require "assert"

assertCreateMessageSentAndReturn = (document) ->
  Thing.socket.on "LiveDocumentCreate", (name, doc, callback) ->
    process.nextTick ->
      document.should.eql(doc)
      callback(document)

failOnCreateMessage = () ->
  Thing.socket.on "LiveDocumentCreate", (name, doc, callback) ->
    assert.fail "Create message should not have been called"

class Thing extends LiveDocument
  @socket = new EventEmitter()

  @key "title", { length: [3...24] }
  @key "description", { max: 140, required: true }

describe "LiveDocument", ->
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    Thing.socket = new EventEmitter()

  describe ".create()", ->
    describe "that is valid", ->
      it "should send a create message", (done) ->
        document = { title: "w00t", description: "w00t w00t" }
        assertCreateMessageSentAndReturn document
        Thing.create document, (doc) ->
          doc.should.eql document
          done()

      it "should generate an id for the document", ->
        document = { title: "w00t", description: "w00t w00t" }
        thing = Thing.create document
        (typeof thing.get("_id")).should.equal "string"

    describe "that does not validate", ->
      describe "because it is missing a required field", ->
        it "should not send a create message", ->
          failOnCreateMessage()
          Thing.create {title:"A title"}
      describe "because it contains invalid data", ->
        it "should not send a create message", ->
          failOnCreateMessage()
          Thing.create {title:"a", description: "herp da derp"}, (doc) ->
        it "should call the callback with an array of fields"
