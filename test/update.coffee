{ EventEmitter }      = require "events"
LiveDocument          = require "../index"
assert                = require "assert"
Mongolian             = require "mongolian"
_                     = require "underscore"
Thing                 = require "./models/thing"
InstanceLayer         = require "../lib/drivers/mongodb/instance_layer"

db = new Mongolian("localhost/LiveDocumentTestDB")

describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 
    socket = new EventEmitter
    Thing.socket = socket
    instanceLayer = new InstanceLayer(socket, db, "../../../test/models")

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
        thing.on "change", (newDoc) ->
          newDoc.get("title").should.equal "new Title"
          newDoc.get("description").should.equal doc.description
          done()

        Thing.update {_id: id}, {title: "new Title"}
