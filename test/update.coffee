{ EventEmitter }      = require "events"
LiveDocument          = require "../index"
assert                = require "assert"
Mongolian             = require "mongolian"
_                     = require "underscore"
LiveDocumentMongo         = require "../lib/drivers/mongodb/live_document_mongo"

class Thing extends LiveDocument

  @modelName = "Thing"
  @socket = new EventEmitter

  @key "title", { length: [3...24], required: true }
  @key "description", { max: 140 }

 
db = new Mongolian("localhost/LiveDocumentTestDB")

describe "LiveDocument", ->
  liveDocumentMongo = null
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.setSocket(socket)
    liveDocumentMongo = new LiveDocumentMongo(socket, db, "../../../test/models")

    db.collection("things").remove {}, (err) ->
      done()

  afterEach () ->
    liveDocumentMongo.cleanup()

  describe ".update()", ->
    
    it "should update a document", (done) ->
      doc = {title: "A title", description: "w00t describd"}
      Thing.create doc, (thing) ->
        thing.set {title: "new Title"}
        thing.save (newDoc) ->
          newDoc.get("title").should.equal "new Title"
          newDoc.get("description").should.equal doc.description
          done()

    it "should update other instances of the document", (done) ->
      doc = {title: "A title", description: "w00t describd"}
      oneDone = false
      Thing.create doc, (thing) ->
        id = thing.get("_id")
        thing.on "saved", (newDoc) ->
          newDoc.get("title").should.equal "new Title"
          newDoc.get("description").should.equal doc.description
          if oneDone
            done()
          else 
            oneDone = true

        thing.set "title", "new Title"
        thing.save () ->
          if oneDone
            done()
          else 
            oneDone = true
          
          done
