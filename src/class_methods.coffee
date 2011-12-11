requestCallbackNonce = 0
define ["underscore", "lib/inflection", "lib/socket", "lib/events"], (_, inflect, socket, events) ->
  {EventEmitter} = events 
  
  _.mixin(inflect)
  classes = {}

  # Static methods to do common database tasks
  LiveDocumentClassMethods =

    # **createDocumentInstance** *private*
    # 
    # factory function to return LiveDocument instances
    # from one or more json documents

    createDocumentInstance: (document) ->
      if Array.isArray(document)
        _.map document, @createDocumentInstance
      else
        new @(document)

    # **sendReadMessage** *private*
    #
    # This method sends a message requesting a document or collection of
    # documents to the server via socket.io or any other class that implements
    # eventEmitter, when the client has received the results call callback

    sendReadMessage: (name, query, callback) ->
      socket.emit "LiveDocumentRead", name, query, requestCallbackNonce
      socket.on "LiveDocument" + requestCallbackNonce, (docs) ->
        if _.isArray(docs)
          _.each(docs, callback)
        else
          callback docs
      requestCallbackNonce += 1

    # **sendCreateMessage** *private*
    #
    # This method sends a message containing new document to create to the server
    # via an eventEmitter, socket, when the client has created the document it
    # calls callback

    sendCreateMessage: (name, document, callback) ->
      socket.emit "LiveDocumentCreate", name, document, callback

    # **sendUpdateMessage** *private*
    #
    # _query_: The document to update 
    #
    # _document_: the new keys/values to add/change
    #
    # This method sends a message to update a single document that matches query
    # via an eventEmitter, socket, when the client has created the document it
    # calls callback 

    sendUpdateMessage: (name, query, document, callback) ->
      socket.emit "LiveDocumentUpdate", name, query, document, callback

    # **read** *public*
    # 
    # _query_: Conditions for the document(s) to find
    #
    # _callback_: Function to call once read is complete, first argument is a
    # list of documents matching query.

    read: (query) ->
      emitter = new EventEmitter()
      @sendReadMessage _(_(@name).pluralize()).uncapitalize(), query, (document) =>
        emitter.emit "insert", document
      return emitter

   
    # **create** *public*
    # 
    # _document_: Document to create
    #
    # _callback_: Function to call once document is created
   
    create: (document, callback) ->
      if(!callback?)
        callback = () ->

      @createDocumentInstance document
      @sendCreateMessage _.pluralize(_.uncapitalize(@name)), document, callback

    update: (query, document, callback) ->
      if(!callback?)
        callback = () ->

      @sendUpdateMessage _.pluralize(_.uncapitalize(@name)), query, document, callback
     
    register: (liveDocumentClass) ->
      classes[liveDocumentClass.name] = liveDocumentClass

    getClass: (name) ->
      classes[name]

  return LiveDocumentClassMethods
