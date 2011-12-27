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


    # Save will create the document if it has not yet been persisted to the
    # database, otherwise it will update the version in the database, calls
    # the callback with itself, returns itself for chaining
    save: (cb) ->
      if @persisted == false
        @constructor.sendCreateMessage @document, () =>
          cb(@)
      else
        doc = _.clone(@document)
        delete doc._id
        @constructor.sendUpdateMessage {_id: @document._id }, doc, () =>
          cb(@)
      return @
    
    # Gets the value of field, takes in an optional function as second
    # parameter, which will get called once the field is available, and every
    # time the field is changed. Great for binding
    #
    # If the callback has arity one, it passes the value, otherwise it passes
    # (key, value)
    
    get: (field) ->
      @document[field]

    # takes in a hash of keys and values to set, or a string as the first arg
    # and a value(anything serializable) as the second.
    
    set: (field, value) ->
      if typeof field == "object"
        _.each field, (v, k) =>
          @set(k, v)
      else
        @document[field] = value
      return @
