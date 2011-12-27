define ["underscore", "events"], (_, {EventEmitter}, inflect) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, @LiveDocumentClass) ->
      @items = []
      @loaded = false
      @ids = {}

    at: (index) ->
      return @items[index]

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server
    # if we already have an item with the same id, call the update
    # event and update our instance.  Otherwise, add it to the collection
    #
    # TODO: this should at some point take sorting and limits into account!
    
    handleNotification: (document, method) ->
      if method == "load"
        # the load method passes in multiple documents
        # we iterate over them
        _.each document, (doc) =>
          doc = new @LiveDocumentClass(doc)
          @items.push doc
          @ids[doc.get("_id")] = @items.length - 1
        @loaded = true
        @emit "load", this
      else if method == "update"
          doc = @items[@ids[document.get("_id")]].set(document)
          @emit "update", doc
        else if method == "insert"
          document = new @LiveDocumentClass(document)
          @items.push(document)
          @ids[document.get("_id")] = @items.length - 1
          @emit "insert", document
        else if method == "delete"
          oldDoc = @items.splice(@ids[document.get("_id")], 1)[0]
          delete @ids[oldDoc.get("_id")]
          @emit "delete", oldDoc
