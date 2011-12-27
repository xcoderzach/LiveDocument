define ["underscore", "cs!lib/object_id"], (_, generateObjectId) ->

  LiveDocumentInstanceMethods =
    constructor: (@document) ->
      @document ?= {}
      if !@document._id
        @name = @constructor.name
        @collectionName = _.pluralize(_.uncapitalize(@name))
        @document._id = generateObjectId()
      @constructor.socket.on "LiveDocumentUpdate" + @get("_id"), (doc) =>
        @set(doc)
        @emit "update", @

    get: (field) ->
      @document[field]

    set: (field, value) ->
      if typeof field == "object"
        _.each field, (v, k) =>
          @set(k, v)
      else
        @document[field] = value
      return @
