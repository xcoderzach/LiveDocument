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
        post.cid.should.equal(p.cid)
        var foundP = BlogPost.findOne(p.get("_id"), function(foundPost) {
          foundP.cid.should.equal(foundPost.cid)
          foundP.cid.should.not.equal(post.cid)
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
