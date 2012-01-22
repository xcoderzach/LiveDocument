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

    db.collection("users").remove({}, function(err) {
      done()
    })
  }) 
  describe("adding an embedded document", function() {
    it("should have created an associated embedded document", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.get("comments").create({body: "Yo cool post bro"}, function(comment) {
          post.get("comments").at(0).should.equal(comment)
          comment.get("body").should.equal("Yo cool post bro")
          done()
        })
      })
    })
    it("should persist the created document", function(done) {
      BlogPost.create({"title": "herp"}, function(p) {
        p.get("comments").create({body: "Yo cool post bro"}, function(comment) {
          var id = p.get("_id")
          BlogPost.findOne(id, function(post) {
            post.get("comments").at(0).document.should.eql(comment.document)
            post.get("comments").at(0).get("body").should.equal("Yo cool post bro")
            done()
          })
        })
      })
    }) 
  })
})
