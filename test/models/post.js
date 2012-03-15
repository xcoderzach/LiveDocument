var LiveDocument = require("../../lib/document")

// pass the server thing in because we don't acutally
// run the client code on the client so we have to hack
// it for tests
module.exports = function(server) {

  var Post = LiveDocument.define("Post")
  Post.server = server

  Post.prototype.getStuff = Post.server(function(done){done(1337)})

  Post.prototype.getPassword = Post.server(function(done){done(this.get("password"))})

  return Post
}
