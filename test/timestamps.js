var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , InstanceLayer     = require("../lib/drivers/mongodb/instance_layer")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , BlogPost          = require("./models/blog_post.js")()
  , db = new Mongolian("localhost/LiveDocumentTestDB")

describe("LiveDocument", function() {
  var instanceLayer
  beforeEach(function(done) {
    var socket = new EventEmitter

    instanceLayer = new InstanceLayer(socket, db, __dirname + "/models")

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
      process.nextTick(function() {
        BlogPost.create({title: "A blog post"}, function(post) {
          post.get("createdAt").should.be.above(timeBeforeCreate)
          done()
        })
      })
    })
    it("should add updatedAt when the document is created", function(done) {
      var timeBeforeUpdate = (new Date).getTime()
      process.nextTick(function() {
        BlogPost.create({title: "A blog post"}, function(post) {
          post.set("title", "new title")
          post.save(function() {
            post.get("updatedAt").should.be.above(timeBeforeUpdate)
            post.get("updatedAt").should.be.above(post.get("createdAt"))
            done()
          })
        })
      })
    })
  })
})
