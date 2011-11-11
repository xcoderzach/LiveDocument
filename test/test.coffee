{ EventEmitter } = require("events")

newMocket = () ->
  new EventEmitter()

module.exports = tests = {}

socket = newMocket()                                  

LiveDocument = require("../src/live_document")

Thing = LiveDocument "thing", socket

tests.testRead = (test) ->
  results = [{test: "value", key: "pair"}]

  socket.on "LiveDocumentRead", (collection, query, callback) ->
    process.nextTick () ->
      callback(JSON.parse(JSON.stringify(results)))

  Thing.read (things) ->
    test.deepEqual(things, results)
    test.done()

tests.testCreateThing = (test) ->
  result = {test: "value", key: "pair"}

  socket.on "LiveDocumentCreate", (collection, doc, callback) ->
    process.nextTick () ->
      callback doc

  Thing.create result, (doc) ->
    test.deepEqual(doc, result, "got the wrong collection")
    test.done()
