define ["underscore", "events"], (_, {EventEmitter}, inflect) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, @LiveDocumentClass) ->
      @items = []
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

    insertAt: (id) ->
      if @orderBy
        _.sortedIndex @items, id, (idToCheck) =>
          @get(idToCheck).get(@orderBy)
      else
        @items.length
      

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server if we already have
    # an item with the same id, call the update event and update our instance.
    # Otherwise, add it to the collection
    
    handleNotification: (document, method) ->
      if method == "load"
        # the load method passes in multiple documents
        # we iterate over them
        _.each document, (doc) =>
          id = doc._id
          doc = new @LiveDocumentClass(doc)
          @ids[id] = doc
          @items.splice(@insertAt(id), 0, id)
          @length = @items.length
        @loaded = true
        @emit "load", this
      else if method == "insert"
        id = document._id
        document = new @LiveDocumentClass(document)
        @ids[id] = document
        @items.splice(@insertAt(id), 0, id)
        @length = @items.length
        @emit "insert", document
      else if method == "remove"
        id = document._id
        index = _(@items).indexOf(id)
        if index >= 0
          oldDoc = @items.splice(index, 1)[0]
          @length = @items.length
          delete @ids[id]
          @emit "remove", oldDoc
