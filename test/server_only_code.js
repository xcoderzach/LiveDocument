var EventEmitter = require("events").EventEmitter
  , LD           = require("../index.coffee")
  , assert       = require("assert")
  , request      = require("superagent")
  , connect      = require("connect")
  , fs           = require("fs")
  , serverModel  = require("./models/post.js")
  , rpcClient    = LD.rpcClient
  , rpcServer    = LD.rpcServer
  , AssetServer  = LD.AssetServer


connect(
    AssetServer({ input: __dirname + "/models/post.js"
                , output: "/javascripts/models/post.js" })
).listen(7357)

describe("LiveDocument client code", function() {
  describe("that has server only code", function() {
    it("should not display that code", function(done) {
      request("http://localhost:7357/javascripts/models/post.js", function(err, res) {
        res.text.should.not.match(/function(done){done(1337)}/)
        done()
      })
    })
  })
  describe("when a server only method is invoked", function() {
    it("should call the method on the server", function(done) {
      request("http://localhost:7357/javascripts/models/post.js", function(err, res) {
        var fd = fs.openSync(__dirname + "/models/postClient.js", "w")
        fs.writeSync(fd, res.text, 0)
        var clientModel = require(__dirname + "/models/postClient.js")

        var socket = new EventEmitter
        // rather than spin up socket.io we use this
        var ClientPost = clientModel(rpcClient(socket))
          , ServerPost = serverModel(rpcServer(socket))

        ClientPost.socket = socket
        ServerPost.socket = socket

        var clientPost = new ClientPost
        clientPost.getStuff(function(number) {
          number.should.equal(1337)
          done()
        })
      })
    })
  })
})
    
