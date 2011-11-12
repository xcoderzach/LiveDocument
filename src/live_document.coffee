Inflector = require "../lib/inflection"
_ = require "../lib/underscore.js"

module.exports = (socket) ->

  class LiveDocument

    constructor: (@document) ->
      @buildAssocs()

    get: (field) ->
      @document[field]

    buildAssocs: () ->
      _.each @constructor.hasOneAssocs, (assoc) =>
        @[assoc] = (callback) =>
          @constructor.sendReadMessage Inflector.pluralize(assoc), { _id: @[assoc + "_id"] }, (docs) ->
            callback docs[0]   

    @createDocumentInstance: (document) ->
      if Array.isArray(document)
        _.map document, (doc) =>
          new @(doc)
      else
        new @(doc)

    @sendReadMessage: (name, query, callback) ->
      socket.emit "LiveDocumentRead", name, query, callback

    @read: (query, callback) ->
      if typeof query == "function"
        callback = query
        query = {}

      @sendReadMessage Inflector.pluralize(Inflector.uncapitalize(@name)), query, (documents) =>
        callback @createDocumentInstance(documents)

    @create: (document, callback) ->
      socket.emit "LiveDocumentCreate", Inflector.pluralize(Inflector.uncapitalize(@name)), document, callback

    @one: (assoc) ->
      @hasOneAssocs ||= []
      @hasOneAssocs.push assoc
      
  return LiveDocument
