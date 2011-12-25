requirejs = require 'requirejs'

requirejs.config { nodeRequire: require, baseUrl: __dirname}
requirejs ["cs!lib/live_document"],(LiveDocument) ->
  module.exports = LiveDocument

