var EventEmitter = require("events").EventEmitter
  , LD           = require("../index.coffee")
  , assert       = require("assert")
  , request      = require("superagent")
  , connect      = require("connect")

  , AssetServer  = LD.AssetServer


connect(
    AssetServer({ input: __dirname + "/models/server.js"
                , output: "/javascripts/models/server.js" })
).listen(7357)

describe("LiveDocument client code that has server only code", function() {
  it("should not display that code", function(done) {
    request("http://localhost:7357/javascripts/models/server.js", function(err, res) {
      res.text.should.not.match(/function(done)\w*{\w*done(this.isStillSecret())\w*}/)
      done()
    })
  })
})
    
