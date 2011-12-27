{ EventEmitter }      = require "events"
{ LiveDocument
, LiveDocumentMongo } = require "../index.coffee"
assert                = require "assert"
Mongolian             = require "mongolian"
_                     = require "underscore"

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

  describe ".update()", ->
    
    it "should update a document", (done) ->
      doc = {title: "A title", description: "w00t describd"}
      Thing.create doc, (thing) ->
        id = thing.get("_id")
        Thing.update {_id: id}, {title: "new Title"}, (newDoc) ->
          newDoc.get("title").should.equal "new Title"
          newDoc.get("description").should.equal doc.description
          done()

    it "should update other instances of the document", (done) ->
      doc = {title: "A title", description: "w00t describd"}
      Thing.create doc, (thing) ->
        id = thing.get("_id")
        thing.on "update", (newDoc) ->
          newDoc.get("title").should.equal "new Title"
          newDoc.get("description").should.equal doc.description
          done()

        Thing.update {_id: id}, {title: "new Title"}
