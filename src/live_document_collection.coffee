requestCallbackNonce = 0

define ["underscore", "lib/events", "lib/socket"], (_, events, socket) ->
  {EventEmitter} = events

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
      socket.emit "LiveDocumentRead", _(@name).uncapitalize(), @query, requestCallbackNonce
      socket.on "LiveDocument" + requestCallbackNonce, (docs, method) =>
        if _.isArray(docs)
          _.each docs, (doc) =>
            @handleNotification doc, method
        else
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
      console.log(document, method)
      index = @ids[document._id]
      if method == "load"
        @items.push(document)
        @ids[document._id] = @items.length - 1
        @emit "load", document
      else if method == "update"
        @items[index] = document
        @emit "update", document
      else if method == "insert"
        @items.push(document)
        @ids[document._id] = @items.length - 1
        @emit "insert", document
      else if method == "delete"
        @items.splice index, 1
        delete @ids[document._id]
        @emit "delete", document

  return LiveDocumentCollection
