var LiveDocument = require("../../index");

module.exports = function(server) {
  var Post = LiveDocument.define("Post");
  Post.server = server;
  Post.prototype.getStuff = Post.server("e733e16725e62e32c5a7b4f83c9e2921");
  Post.prototype.getPassword = Post.server("cf7c907cdd4881e9de7bd4dc3f540bfd");
  return Post;
};