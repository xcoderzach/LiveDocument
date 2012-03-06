var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , LiveDocumentMongo     = require("../lib/drivers/mongodb/live_document_mongo")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , BlogPost          = require("./models/blog_post.js")
  , db = new Mongolian("localhost/LiveDocumentTestDB")

describe("LiveDocument", function() {
  var liveDocumentMongo
  beforeEach(function(done) {
    var socket = new EventEmitter

    liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

    BlogPost.setSocket(socket)

    db.collection("blogPosts").remove({}, function(err) {
      try {
        done()
      } catch(e) {
        console.log(e)
      }
    })
  })         
  afterEach(function() {
    liveDocumentMongo.cleanup()
    liveDocumentMongo = null
  }) 
  describe("client ids", function() {
    it("should give a unique clientId to each document", function(done) {
      var p = BlogPost.create({title: "herpderp"}, function(post) {
        post.id.should.equal(p.id)
        var foundP = BlogPost.findOne(p.get("_id"), function(foundPost) {
          foundP.id.should.equal(foundPost.id)
          foundP.id.should.not.equal(post.id)
          done()
        })
      })
    })
  })
  describe(".keys() method", function() {
    it("should return a list of the keys for the document", function() {
      BlogPost.create({title: "herpderp"}).keys().should.eql(["title", "_id", "createdAt", "updatedAt"])
    })
  })
})
