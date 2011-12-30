requirejs = require 'requirejs'

requirejs.config { nodeRequire: require, baseUrl: __dirname}
requirejs ["cs!lib/live_document", "cs!lib/drivers/mongodb/live_document_mongo", "lib/asset_server", "lib/rpcClient", "lib/rpcServer"]
, (LiveDocument, LiveDocumentMongo, AssetServer, rpcClient, rpcServer) ->
  module.exports.LiveDocument = LiveDocument
  module.exports.LiveDocumentMongo = LiveDocumentMongo
  module.exports.AssetServer = AssetServer
  module.exports.rpcClient = rpcClient
  module.exports.rpcServer = rpcServer

