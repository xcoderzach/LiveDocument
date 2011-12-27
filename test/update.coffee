{ EventEmitter } = require "events"
LiveDocument     = require "../index.coffee"
assert           = require "assert"

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
      q = {_id: "12341234dfsasdf"}
      doc = {title: "A title", description: "w00t describd"}
      Thing.socket.on "LiveDocumentUpdate", (name, query, document, callback) ->
        name.should.equal "things"
        query.should.eql q
        document.should.eql doc
        done()
      Thing.update(q, doc)
