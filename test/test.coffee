{ EventEmitter } = require("events")

newMocket = () ->
  new EventEmitter()

module.exports = tests = {}

socket = newMocket()                                  

LiveDocument = require("../src/live_document")(socket)

class Thing extends LiveDocument


tests.testRead = (test) ->
  results = [{test: "value", key: "pair"}]

  socket.on "LiveDocumentRead", (collection, query, callback) ->
    if collection == "things"
      process.nextTick () ->
        callback(JSON.parse(JSON.stringify(results)))

  Thing.read (things) ->
    test.ok things[0] instanceof Thing
    test.deepEqual things[0].document, results[0]
    test.done()

tests.testCreateThing = (test) ->
  result = {test: "value", key: "pair"}

  socket.on "LiveDocumentCreate", (collection, doc, callback) ->
    if collection == "things"
      test.equal collection, "things"
      process.nextTick () ->
        callback(JSON.parse(JSON.stringify(doc)))

  Thing.create result, (doc) ->
    test.deepEqual(doc, result, "got the wrong collection")
    test.done()

tests.testHasOneAssociation = (test) ->
  test.expect(1)
  socket.removeAllListeners()
  profiles = [{job: "code"}]
  users = [{name: "guy"}]
  socket.on "LiveDocumentRead", (collection, query, callback) ->
    if(collection == "profiles")
      callback JSON.parse(JSON.stringify(profiles))
    else if (collection == "users")
      callback JSON.parse(JSON.stringify(users))
 
  class Profile extends LiveDocument

  class User extends LiveDocument
    @one "profile"

  User.read {}, (users) ->
    users[0].profile (profile) ->
      test.ok profile
      test.done()
