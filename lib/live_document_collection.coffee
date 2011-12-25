define ["underscore", "events"], (_, {EventEmitter}, inflect) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, name) ->
      @name = _(name).pluralize()
      @items = []
      @loaded = false
      @ids = {}

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server
    # if we already have an item with the same id, call the update
    # event and update our instance.  Otherwise, add it to the collection
    #
    # TODO: this should at some point take sorting and limits into account!
    
    handleNotification: (document, method) ->
      if method == "load"
        #the load method passes in multiple documents
        _.each document, (doc) =>
          @items.push doc
          @ids[doc._id] = @items.length - 1
        @loaded = true
        @emit "load", document
      else if method == "update"
        @items[@ids[document._id]] = document
        @emit "update", document
      else if method == "insert"
        @items.push(document)
        @ids[document._id] = @items.length - 1
        @emit "insert", document
      else if method == "delete"
        @items.splice @ids[document._id], 1
        delete @ids[document._id]
        @emit "delete", document
