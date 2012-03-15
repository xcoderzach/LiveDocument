var EventEmitter      = require("events").EventEmitter
  , timer             = require("timers")
  , LiveDocument      = require("../lib/document")
  , LiveDocumentMongo     = require("../lib/server")
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

  describe(".timestamps", function() {
    it("should add createdAt when the document is created", function(done) {
      var timeBeforeCreate = (new Date).getTime()
      timer.setTimeout(function() {
        BlogPost.create({title: "A blog post"}, function(post) {
          post.get("createdAt").should.be.above(timeBeforeCreate)
          done()
        })
      }, 10)
    })
    it("should add updatedAt when the document is created", function(done) {
      var timeBeforeUpdate = (new Date).getTime()
      timer.setTimeout(function() {
        BlogPost.create({title: "A blog post"}, function(post) {
          post.set("title", "new title")
          post.save(function() {
            post.get("updatedAt").should.be.above(timeBeforeUpdate)
            done()
          })
        })
      }, 10)
    })
  })
})
