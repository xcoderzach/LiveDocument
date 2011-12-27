{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"

db = new Mongolian("localhost/LiveDocumentTestDB")


class Thing extends LiveDocument
  @socket = new EventEmitter
  @key "title", { length: [3...24] }
  @key "description", { max: 140, required: true }

describe "LiveDocument", ->
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.socket = socket
    new LiveDocumentMongo(socket, db)

  describe ".create()", ->
    describe "that is valid", ->
      it "should send a create message", (done) ->
        document = { title: "w00t", description: "w00t w00t" }
        Thing.create document, (doc) ->
          doc.should.eql document
          done()

      it "should generate an id for the document", ->
        document = { title: "w00t", description: "w00t w00t" }
        thing = Thing.create document
        (typeof thing.get("_id")).should.equal "string"
 
    describe "that does not validate", ->
      describe "because it is missing a required field", ->
        it "should not send a create message"
      describe "because it contains invalid data", ->
        it "should not send a create message"
        it "should call the callback with an array of fields"
