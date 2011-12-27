define ["underscore", "cs!lib/object_id"], (_, generateObjectId) ->

  LiveDocumentInstanceMethods =
    constructor: (@document) ->
      @document ?= {}
      @deleted = false
      @persisted = false
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

    save: (cb) ->
      if @persisted == false
        @constructor.sendCreateMessage @document, () =>
          cb(@)
      else
        doc = _.clone(@document)
        delete doc._id
        @constructor.sendUpdateMessage {_id: @document._id }, doc, () =>
          cb(@)

    
 
    get: (field) ->
      @document[field]

    set: (field, value) ->
      if typeof field == "object"
        _.each field, (v, k) =>
          @set(k, v)
      else
        @document[field] = value
      return @
