if (typeof define != 'function') then define = (require('amdefine'))(module)
define [ "underscore", "./object_id"], (_, generateObjectId) ->

  LiveDocumentInstanceMethods =
    constructor: (@document) ->
      @document ?= {}
      @deleted = false
      @saved = false
      @persisted = false
      @loaded = false
      @alreadyChanging = false

      @modelName = @constructor.modelName
      @collectionName = _.pluralize(_.uncapitalize(@modelName))

      if !@document._id
        @document._id = generateObjectId()

      @constructor.socket.on "LiveDocumentUpdate" + @get("_id"), (doc) =>
        @set(doc)
      @constructor.socket.on "LiveDocumentDelete" + @get("_id"), (doc) =>
        @deleted = true
        @set(doc)
        @emit "delete", @


    # Save will create the document if it has not yet been persisted to the
    # database, otherwise it will update the version in the database, calls
    # the callback with itself, returns itself for chaining
    save: (cb) ->
      cb ?= ->
      afterAfterSave = () =>
        @emit "saving", @
        if @persisted == false
          @constructor.sendCreateMessage @document, () =>
            @saved = true
            @emit "saved", @
            cb(@)
            @persisted = true
        else
          # TODO only send changed fields
          doc = _.clone(@document)
          delete doc._id
          @constructor.sendUpdateMessage {_id: @document._id }, doc, () =>
            @saved = true
            cb(@)
            @emit "saved", @
      if @constructor.beforeSaveFunctions?
        callNext = (i) =>
          if(i < @constructor.beforeSaveFunctions.length)
            _(@constructor.beforeSaveFunctions[i]).bind(@) (err) =>
              if(!err?)
                callNext(i+1)
              else
                @emit("error", err)
            , @
          else
            afterAfterSave()
        callNext(0)
      else
        afterAfterSave()
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
    # fires a change event, which happens after all of the changes have been made
    #
    # If you call set from inside of a change event, it won't call another change
    # event, phew!
    
    set: (field, value) ->
      alreadyChanging = @alreadyChanging
      @alreadyChanging = true
      # we're initiating the changes, so we'll store the old values
      if alreadyChanging == false
        @previousDocument = _.clone(@document)

      if typeof field == "object"
        _.each field, (v, k) =>
          @set(k, v)
      else
        oldValue = @document[field]
        if(@document[field] != value)
          @document[field] = value
          @emit "change:" + field, value, oldValue, @

        # if THIS instance of set started the changes, it should emit the change 
        # event and then end the changingness
      if alreadyChanging == false
        fields = _.union(_.keys(@document), _.keys(@previousDocument))

        changedFields = _.filter fields, (key) =>
          @document[key] != @previousDocument[key]
                            
        # if something actually changed
        if changedFields.length > 0
          @saved = false
          @emit "change", @, changedFields
        @previousDocument = _.clone(@document)
        @alreadyChanging = false

      return @
