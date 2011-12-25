requestCallbackNonce = 0

define ["underscore", "events"], (_, {EventEmitter}) ->

  class LiveDocumentCollection extends EventEmitter

    constructor: (@query, name) ->
      @name = _(name).pluralize()
      @items = []
      @ids = {}
      @sendReadMessage()

    # **sendReadMessage** *private*
    #
    # This method sends a message requesting a document or collection of
    # documents to the server via socket.io or any other class that implements
    # eventEmitter, when the client has received the results call callback

    sendReadMessage: () ->
      @socket.emit "LiveDocumentRead", _(@name).uncapitalize(), @query, requestCallbackNonce
      @socket.on "LiveDocument" + requestCallbackNonce, (docs, method) =>
        @handleNotification docs, method
      requestCallbackNonce += 1

    # **handleNotification** *private*
    # 
    # Called when a notification is pushed from the server
    # if we already have an item with the same id, call the update
    # event and update our instance.  Otherwise, add it to the collection
    #
    # TODO: this should at some point take sorting and limits into account!
    #
    handleNotification: (document, method) ->
      if method == "load"
        _.each document, (doc) =>
          @items.push doc
          @ids[doc._id] = @items.length - 1
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
