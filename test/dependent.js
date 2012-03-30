var EventEmitter      = require("events").EventEmitter
  , LiveDocumentMongo = require("../lib/server")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , db                = new Mongolian("localhost/LiveDocumentTestDB")
  , Document          = require("../lib/document")
  , socket            = new EventEmitter

Document.setSocket(socket) 

var User              = require("./models/user")
  , Profile           = require("./models/profile")
  , Worker            = require("./models/worker")
  , Task              = require("./models/task")
  , liveDocumentMongo = new LiveDocumentMongo(socket, db, __dirname + "/models")

delete require.cache[require.resolve("./models/user")]
delete require.cache[require.resolve("./models/profile")]
delete require.cache[require.resolve("./models/worker")]
delete require.cache[require.resolve("./models/task")]

User.isServer = false
Profile.isServer = false
Worker.isServer = false
Task.isServer = false

describe("LiveDocument", function() {
  beforeEach(function(done) {
    db.collection("users").remove({}, function(err) {
      db.collection("profiles").remove({}, function(err) {
        done()
      })
    })
  })
  afterEach(function() {
    liveDocumentMongo.cleanup()
  }) 
  describe("a dependent has one associations", function() {
    it("should be deleted when the parent is deleted", function(done) {
      User.create({ name: "mah name" }, function(user) {
        user.assoc("profile", function(profile) {
          profile.save(function() {
            user.remove()
            profile.on("delete", function() {
              done()
            })
          })
        })
      })
    })
  })
  describe("a dependent has many associations", function() {
    it("should be deleted when the parent is deleted", function(done) {
      Worker.create({name: "Zach"}, function(worker) {
        worker.assoc("tasks", function(tasks) { 
          var task = Task.create({title: "make test pass", workerId: worker.get("_id")})
          var taskId = task.get("_id")
          task.once("delete", function() {
            done()
          })
          worker.remove()
        })
      })
    })
  }) 
}) 
