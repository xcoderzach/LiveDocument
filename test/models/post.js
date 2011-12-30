var LiveDocument = require("../../index.coffee").LiveDocument

// pass the server thing in because we don't acutally
// run the client code on the client so we have to hack
// it for tests
module.exports = function(server) {

  var Post = LiveDocument.define("Post")

  Post.prototype.getStuff = server(function(done){done(1337)})

  return Post
}
