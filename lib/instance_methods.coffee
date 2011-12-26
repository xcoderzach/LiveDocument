define ["underscore", "cs!lib/object_id"], (_, generateObjectId) ->

  LiveDocumentInstanceMethods =
    constructor: (@document) ->
      @document ?= {}
      if !@document._id
        @name = @constructor.name
        @collectionName = _.pluralize(_.uncapitalize(@name))
        @document._id = generateObjectId()

    get: (field) ->
      @document[field]

    set: (field, value) ->
      @document[field] = value

    watch: (callback) ->
      @constructor.sendReadMessage @collectionName, @document, (docs) ->
        callback docs[0]

    create: (document, callback) ->
      document[@name + "_id"] = @_id
      @constructor.sendCreateMessage _.pluralize(@name), document, (doc) ->
         callback doc

    update: (document, callback) ->
      @constructor.sendUpdateMessage _.pluralize(@name), @document, document, (doc) ->
        callback doc
