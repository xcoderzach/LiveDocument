define ["underscore", "events"], (_, {EventEmitter}, inflect) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, @LiveDocumentClass) ->
      @items = []
      @changeListeners = {}
      @loaded = false
      @ids = {}
      @length = @items.length
      @orderBy = false

    # returns the item at position _index_ in the collection
    at: (index) ->
      return @ids[@items[index]]

    # returns the item with _id_ in the collection
    get: (id) ->
      return @ids[id]

    # Set the _field_ name by which to sort your collection
    sortBy: (field) ->
      @orderBy = field
      return @

    # Returns the index at which to insert item with id _id_
    # it no sorting is specified, just append it to the bottom
    # you probably dont need to use this
    insertAt: (id) ->
      if @orderBy
        _.sortedIndex @items, id, (idToCheck) =>
          @get(idToCheck).get(@orderBy)
      else
        @items.length

    documentChange: (document, changedFields) ->
      if @orderBy && _(changedFields).indexOf(@orderBy) >= 0
        oldIndex = _(@items).indexOf document.get("_id")
        newIndex = @insertAt document.get("_id")
      # if the place where we WOULD insert it, if we were to reinsert it
      # is not 0 (right before itself) or 1 (right after itself)
        if 0 >= (oldIndex - newIndex) <= 1
          @handleRemove(document)
          @handleInsert(document)

    handleLoad: (documents) ->
      _.each documents, (doc) =>
        @handleInsert(doc, false)
      @loaded = true
      @emit "load", this

    handleInsert: (document, emit) ->
      emit ?= true
      if(document instanceof @LiveDocumentClass)
        id = document.get("_id")
      else
        id = document._id
        document = new @LiveDocumentClass(document)
      changeListener = @documentChange.bind(@)
      document.on "change", changeListener
      @ids[id] = document
      @changeListeners[id] = changeListener
      @items.splice(@insertAt(id), 0, id)
      @length = @items.length
      if emit
        @emit "insert", document, @

    handleRemove: (document) ->
      if(document instanceof @LiveDocumentClass)
        id = document.get("_id")
      else
        id = document._id
      index = _(@items).indexOf(id)
      if index >= 0
        oldDoc = @ids[id]
        @items.splice(index, 1)
        @length = @items.length
        oldDoc.removeListener("change", @changeListeners[id])
        delete @changeListeners[id]
        delete @ids[id]
        @emit "remove", oldDoc, @

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server if we already have
    # an item with the same id, call the update event and update our instance.
    # Otherwise, add it to the collection
    
    handleNotification: (document, method) ->
      if method == "load"
        @handleLoad(document)
      else if method == "insert"
        @handleInsert(document)
      else if method == "remove"
        @handleRemove(document)
