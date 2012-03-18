var Document = require("./document")
  , _ = require("underscore")

function EmbeddedDocument(document, opts) {
  opts = opts || {}
  opts.embedded = true
  Document.call(this, document, opts)
}
EmbeddedDocument.embedded = true

var ctor = function() {}
ctor.prototype = Document.prototype
EmbeddedDocument.prototype = new ctor
EmbeddedDocument.prototype.embedded = true
 
_.extend(EmbeddedDocument, Document)
module.exports = EmbeddedDocument

return EmbeddedDocument
