var EventEmitter    = require("events").EventEmitter 
, LiveDocument      = require("../lib/document")
, LiveDocumentMongo     = require("../lib/server")
, assert            = require("assert")
, Mongolian         = require("mongolian")
, ChangeDispatch    = require("../lib/server/change_dispatch")
, LiveDocumentMongo = require("../lib/server")

, db = new Mongolian("localhost/LiveDocumentTestDB")

                                               
var User = LiveDocument.define("User")
.key("name", { length: [3,24] })
.key("job", { max: 140 })
 
describe("LiveDocument", function() {
  var liveDocumentMongo
  beforeEach(function(done) {
    var socket = new EventEmitter

    liveDocumentMongo = new LiveDocumentMongo(socket, db, "../../../test/models")
    liveDocumentMongo.cleanup()

    User.socket = socket
    
    db.collection("users").remove({}, function(err) {
      done()
    })

  }) 
  afterEach(function() {
    liveDocumentMongo.cleanup()
  })
  describe("when I do a lot of shit", function() {

    it("should garbage collect single document watchers", function(done) {
      var numDone = 0
      function afterAll() {
        //give it a couple of tix
        process.nextTick(function() {
          process.nextTick(function() {
            liveDocumentMongo.changeDispatch.ids.should.eql({})
            ChangeDispatch.globalIdListeners.should.eql({})
            User.listeners.should.eql({}) 
            done()
          })
        })
      }
      for(var i = 0 ; i <= 10 ; i++) {
        User.create({"name": "Zach"}, function(user) {
          user.stopListening()
          numDone++
          if(numDone === 10) {
            afterAll()
          }
        })
      }
    })
    it("should garbage collect collection watchers", function(done) {
      var numDone = 0
      function afterAll() {
        //give it a couple of tix
        ChangeDispatch.globalQueryListeners.should.eql([])
        ChangeDispatch.globalIdListeners.should.eql({})
        done()
      }
      for(var i = 0 ; i <= 10 ; i++) {
        User.create({"name": "Zach"}, function(user) {
          user.stopListening()
          numDone++
  
          if(numDone === 10) {
            User.find({}, function(users) {
              users.stopListening()
              afterAll()
            })
          }
        })
      }
    }) 
  })
})        
