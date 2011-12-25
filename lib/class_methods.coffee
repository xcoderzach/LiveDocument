define ["underscore", "cs!lib/inflection", "cs!lib/live_document_collection"], (_, inflect, LiveDocumentCollection) ->
  
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



    # **sendCreateMessage** *private*
    #
    # This method sends a message containing new document to create to the server
    # via an eventEmitter, socket, when the client has created the document it
    # calls callback

    sendCreateMessage: (name, document, callback) ->
      @socket.emit "LiveDocumentCreate", name, document, callback

    # **sendDeleteMessage** *private*
    #
    # This method sends a message containing the query to find a document to delete

    sendDeleteMessage: (name, query, callback) ->
      @socket.emit "LiveDocumentDelete", name, query, callback
 
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
      @socket.emit "LiveDocumentUpdate", name, query, document, callback

    # **read** *public*
    # 
    # _query_: Conditions for the document(s) to find
    #
    # _callback_: Function to call once read is complete, first argument is a
    # list of documents matching query.

    read: (query) ->
      return new LiveDocumentCollection query, @name

   
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

    delete: (query, callback) ->
      if(!callback?)
        callback = () ->

      @sendDeleteMessage _.pluralize(_.uncapitalize(@name)), query, callback

  return LiveDocumentClassMethods
