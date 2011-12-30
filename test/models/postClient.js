var LiveDocument = require("../../index.coffee").LiveDocument;

module.exports = function(server) {
  var Post = LiveDocument.define("Post");
  Post.prototype.getStuff = server("e733e16725e62e32c5a7b4f83c9e2921");
  return Post;
};