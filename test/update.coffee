{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"
assert           = require "assert"
_                = require "underscore"

class Thing extends LiveDocument
  @socket = new EventEmitter()

  @key "title", { length: [3...24] }
  @key "description", { max: 140, required: true }
 
describe "LiveDocument", ->
  beforeEach ->
    # clean out all of the old listeners from previous tests 
    Thing.socket = new EventEmitter()

  describe ".update()", ->
    
    it "should send an update message", (done) ->
      conditions = {_id: "12341234dfsasdf"}
      doc = {title: "A title", description: "w00t describd"}
      Thing.socket.on "LiveDocumentUpdate", (name, query, document, callback) ->
        name.should.equal "things"
        query.should.eql conditions
        document.should.eql doc
        done()
      doc = Thing.update(conditions, doc)
      

    it "create a LiveDocument instance with the response", (done) ->
      conditions = {_id: "12341234dfsasdf"}
      updateDoc = {title: "A title", description: "w00t describd"}
      Thing.socket.on "LiveDocumentUpdate", (name, query, document, callback) ->
        process.nextTick ->
          callback(_.extend({}, query, document))

      document = Thing.update conditions, updateDoc, (doc) ->
        (doc instanceof Thing).should.equal(true)
        doc.get("title").should.equal(updateDoc.title)
        doc.get("description").should.equal(updateDoc.description)
        doc.get("_id").should.equal(conditions._id)
        done()
      (document instanceof Thing).should.equal(true)
