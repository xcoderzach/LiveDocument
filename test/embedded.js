var EventEmitter      = require("events").EventEmitter
  , LiveDocument      = require("../lib/document")
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , Document          = require("../lib/document")
  , socket            = new EventEmitter
Document.setSocket(socket) 

delete require.cache[require.resolve("./models/blog_post")]
delete require.cache[require.resolve("./models/comment")]

var BlogPost          = require("./models/blog_post.js")
  , Comment           = require("./models/comment.js")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

BlogPost.isServer = false
Comment.isServer = false

delete require.cache[require.resolve("./models/blog_post")]
delete require.cache[require.resolve("./models/comment")]

describe("LiveDocument", function() {
  beforeEach(function(done) {
    db.collection("blogPosts").remove({}, function(err) {
      done()
    })
  })
  afterEach(function() {
    liveDocumentMongo.cleanup()
  })
  describe("adding an embedded document", function() {
    it("should have created an associated embedded document", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          post.assoc("comments").at(0).should.equal(comment)
          comment.get("body").should.equal("Yo cool post bro")
          done()
        })
      })
    })
    it("should to should emit insert event on it's collections")
    it("should persist the created document", function(done) {
      BlogPost.create({"title": "herp"}, function(p) {
        p.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          var id = p.get("_id")
          BlogPost.findOne(id, function(post) {
            post.assoc("comments").at(0).document.should.eql(comment.document)
            post.assoc("comments").at(0).get("body").should.equal("Yo cool post bro")
            done()
          })
        })
      })
    })
  })
  describe("deleting an embedded document", function() {
    it("should delete the embedded document", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          post.assoc("comments").at(0).remove(function() {
            comment.deleted.should.equal(true)
            ;(typeof post.assoc("comments").at(0)).should.equal("undefined")
            done()
          })
        })
      })
    })
    it("should not be in the database", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          post.assoc("comments").at(0).remove(function() {
            BlogPost.findOne(post.get("_id"), function(post) {
              ;(typeof post.assoc("comments").at(0)).should.equal("undefined")
              done()
            })
          })
        })
      })
    })
    it("any collections it belongs to should emit a remove event", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          var postCopy = BlogPost.findOne(post.get("_id"), function() {
            post.assoc("comments").at(0).remove(function() {
              ;(typeof post.assoc("comments").at(0)).should.equal("undefined")
              process.nextTick(function() {
                ;(typeof postCopy.assoc("comments").at(0)).should.equal("undefined")
              })
              done()

            })
          })
        })
      })
    })
  })
  describe("updating an embedded document", function() {
    it("should save the changes", function(done) {
      var post = BlogPost.create({"title": "herp"}, function() {
        post.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
          comment.set({body: "herp derp"})
          comment.save(function() {
            BlogPost.findOne(post.get("_id"), function(post) {
              post.assoc("comments").at(0).get("body").should.equal("herp derp")
              done()
            })
          })
        })
      })
    })
    it("should update other documents with the changes", function(done) {
      var p = BlogPost.create({"title": "herp"}, function() {
        BlogPost.findOne(p.get("_id"), function(post) {
          p.assoc("comments").push({body: "Yo cool post bro"}, function(comment) {
            comment.set({body: "herp derp"})
            comment.save(function() {
              post.assoc("comments").at(0).get("body").should.equal("herp derp")
              done()
            })
          })
        })
      })
    })
  })
})
