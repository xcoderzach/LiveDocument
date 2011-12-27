define ["underscore", "cs!lib/object_id"], (_, generateObjectId) ->

  LiveDocumentInstanceMethods =
    constructor: (@document) ->
      @document ?= {}
      @deleted = false
      if !@document._id
        @name = @constructor.name
        @collectionName = _.pluralize(_.uncapitalize(@name))
        @document._id = generateObjectId()
      @constructor.socket.on "LiveDocumentUpdate" + @get("_id"), (doc) =>
        @set(doc)
        @emit "update", @
      @constructor.socket.on "LiveDocumentDelete" + @get("_id"), (doc) =>
        @deleted = true
        @set(doc)
        @emit "delete", @
 
    get: (field) ->
      @document[field]

    set: (field, value) ->
      if typeof field == "object"
        _.each field, (v, k) =>
          @set(k, v)
      else
        @document[field] = value
      return @
