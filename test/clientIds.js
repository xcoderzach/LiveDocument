var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../index")
  , InstanceLayer     = require("../lib/drivers/mongodb/instance_layer")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , BlogPost          = require("./models/blog_post.js")
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
  afterEach(function() {
    instanceLayer.cleanup()
    instanceLayer = null
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
      BlogPost.create({title: "herpderp"}).keys().should.eql(["title"])
    })
  })
})
