var EventEmitter      = require("events").EventEmitter , LiveDocument      = require("../index")
  , InstanceLayer     = require("../lib/drivers/mongodb/instance_layer")
  , assert            = require("assert")
  , Mongolian         = require("mongolian")
  , User              = require("./models/user")()

  , db = new Mongolian("localhost/LiveDocumentTestDB")

describe("LiveDocument", function() {
  var instanceLayer
  beforeEach(function(done) {
    var socket = new EventEmitter

    instanceLayer = new InstanceLayer(socket, db, "../../../test/models")

    User.setSocket(socket)

    db.collection("users").remove({}, function(err) {
      done()
    })
  }) 
  afterEach(function() {
    instanceLayer.cleanup()
  })

  describe(".editableBy method", function() { 
    describe("when given self", function() {
      it("should be editable by the current user", function(done) {
        var currentUser = User.create({ name: "Zach Smith"
                                      , job: "JavaScript Developer" }, function() {
          var id = currentUser.get("_id")
          User.currentUserId = id
          instanceLayer.setCurrentUserId(id)
      
          User.update(id, {name: "Bizarro Zach Smith", "job": "Java Developer"}, function(user) {
            user.get("name").should.equal("Bizarro Zach Smith")
            done()
          })
        })
      })
      it("should not be editable by other users", function(done) {
        var currentUser = User.create({ name: "Zach Smith", job: "JavaScript Developer" }, function() {
          var cantEdit = User.create({ name: "Not Zach Smith", job: "Java Developer" }, function() {
            var id = cantEdit.get("_id")
            instanceLayer.setCurrentUserId(currentUser.get("_id"))
            User.currentUserId = currentUser.get("_id")

            var user = User.update(id, {name: "H4XX'd ur acct br0"}, function() {
              done("shouldn't run this, should be stopped since not authorized")
            })
            user.on("error", function(instance, message) {
              message.should.equal("Not authorized")
              done()
            })
          }) 
        }) 
      })
    })
  })
})
