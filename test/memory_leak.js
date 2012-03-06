var EventEmitter    = require("events").EventEmitter 
, LiveDocument      = require("../index")
, LiveDocumentMongo     = require("../lib/drivers/mongodb/live_document_mongo")
, assert            = require("assert")
, Mongolian         = require("mongolian")
, ChangeDispatch    = require("../lib/drivers/mongodb/change_dispatch")
, LiveDocumentMongo = require("../lib/drivers/mongodb/live_document_mongo")

, db = new Mongolian("localhost/LiveDocumentTestDB")

                                               
var User = LiveDocument.define("User")
.key("name", { length: [3,24] })
.key("job", { max: 140 })
 
var liveDocumentMongo
describe("LiveDocument", function() {
  beforeEach(function(done) {
    var socket = new EventEmitter

    liveDocumentMongo = new LiveDocumentMongo(socket, db, "../../../test/models")

    User.socket = socket
    
    db.collection("users").remove({}, function(err) {
      done()
    })

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
