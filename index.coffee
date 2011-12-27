requirejs = require 'requirejs'

requirejs.config { nodeRequire: require, baseUrl: __dirname}
requirejs ["cs!lib/live_document", "cs!lib/drivers/mongodb/live_document_mongo"],(LiveDocument, LiveDocumentMongo) ->
  module.exports.LiveDocument = LiveDocument
  module.exports.LiveDocumentMongo = LiveDocumentMongo
