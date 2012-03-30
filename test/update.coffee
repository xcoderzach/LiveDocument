{ EventEmitter }      = require "events"
LiveDocument          = require "../lib/document"
assert                = require "assert"
Mongolian             = require "mongolian"
_                     = require "underscore"
LiveDocumentMongo     = require "../lib/server"
socket                = new EventEmitter
Document              = require "../lib/document"
Document.setSocket(socket)
Thing                 = require "./models/thing"
Thing.isServer        = false

delete require.cache[require.resolve("./models/thing")]

db = new Mongolian("localhost/LiveDocumentTestDB")
liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models") 


describe "LiveDocument", ->
  beforeEach (done) ->
    # clean out all of the old listeners from previous tests 

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
