_ = require "../lib/underscore.js"
_.mixin(require "../lib/inflection")
generateObjectId = require("../src/object_id")
socket = require("../src/socket_singleton").getSocket()

module.exports = LiveDocumentInstanceMethods = 
  constructor: (@document) ->
    if !@document._id 
      @collectionName = @constructor.name
      @document._id = generateObjectId()
    @buildAssocs()

  get: (field) ->
    @document[field]

  set: (field, value) ->
    @document[field] = value

  watch: (callback) ->
    @constructor.sendReadMessage _.uncapitalize(_.pluralize(@collectionName)), @document, (docs) ->
      callback docs[0]   

  create: (document, callback) ->
    document[@collectionName + "_id"] = @_id
    @constructor.sendCreateMessage _.pluralize(@collectionName), document, (doc) ->
       callback doc  

  update: (document, callback) ->
    @constructor.sendUpdateMessage _.pluralize(@collectionName), @document, document, (doc) ->
      callback doc    

  buildAssocs: () ->
    _.each @constructor.hasOneAssocs, (assoc) =>
      foreignKey = @collectionName + "_id"
      query = {}
      query[foreignKey] = @_id
      
      assocClass = @constructor.getClass _.capitalize(assoc)
      @[assoc] = new assocClass(query)
