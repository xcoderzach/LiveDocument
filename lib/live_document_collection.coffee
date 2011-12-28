define ["underscore", "events"], (_, {EventEmitter}, inflect) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, @LiveDocumentClass) ->
      @items = []
      @loaded = false
      @ids = {}
      @length = @items.length

    # returns the item at position _index_ in the collection
    at: (index) ->
      return @ids[@items[index]]

    # returns the item with _id_ in the collection
    get: (id) ->
      return @ids[id]

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server if we already have
    # an item with the same id, call the update event and update our instance.
    # Otherwise, add it to the collection
    #
    # TODO: this should at some point take sorting and limits into account!
    
    handleNotification: (document, method) ->
      if method == "load"
        # the load method passes in multiple documents
        # we iterate over them
        _.each document, (doc) =>
          id = doc._id
          doc = new @LiveDocumentClass(doc)
          @items.push id
          @length = @items.length
          @ids[id] = doc
        @loaded = true
        @emit "load", this
      else if method == "insert"
        id = document._id
        document = new @LiveDocumentClass(document)
        @items.push(id)
        @length = @items.length
        @ids[id] = document
        @emit "insert", document
      else if method == "remove"
        id = document._id
        index = _(@items).indexOf(id)
        if index >= 0
          oldDoc = @items.splice(index, 1)[0]
          @length = @items.length
          delete @ids[id]
          @emit "remove", oldDoc
