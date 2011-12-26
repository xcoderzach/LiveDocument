requestCallbackNonce = 0

define ["underscore", "cs!lib/live_document_collection"], (_, LiveDocumentCollection) ->
  
  # Static methods to do common database tasks
  LiveDocumentClassMethods =
    LiveDocumentCollection.socket = @socket

    # **createDocumentInstance** *private*
    # 
    # factory function to return LiveDocument instances
    # from one or more json documents

    createDocumentInstance: (document) ->
      if Array.isArray(document)
        _.map document, @createDocumentInstance
      else
        new @(document)

    collectionName: () ->
      _.uncapitalize _.pluralize @name

    # **sendReadMessage** *private*
    #
    # This method sends a message requesting a document or collection of
    # documents to the server via socket.io or any other class that implements
    # eventEmitter, when the client has received the results call callback

    sendReadMessage: (query, callback) ->
      @socket.emit "LiveDocumentRead", @collectionName(), query, requestCallbackNonce
      @socket.on "LiveDocument" + requestCallbackNonce, (docs, method) =>
        callback docs, method
      requestCallbackNonce += 1

    # **sendCreateMessage** *private*
    #
    # This method sends a message containing new document to create to the server
    # via an eventEmitter, socket, when the client has created the document it
    # calls callback

    sendCreateMessage: (document, callback) ->
      @socket.emit "LiveDocumentCreate", @collectionName(), document, callback

    # **sendDeleteMessage** *private*
    #
    # This method sends a message containing the query to find a document to delete

    sendDeleteMessage: (query, callback) ->
      @socket.emit "LiveDocumentDelete", @collectionName(), query, callback
 
    # **sendUpdateMessage** *private*
    #
    # _query_: The document to update 
    #
    # _document_: the new keys/values to add/change
    #
    # This method sends a message to update a single document that matches query
    # via an eventEmitter, socket, when the client has created the document it
    # calls callback 

    sendUpdateMessage: (query, document, callback) ->
      @socket.emit "LiveDocumentUpdate", @collectionName(), query, document, callback

    # **read** *public*
    # 
    # _query_: Conditions for the document(s) to find
    #
    # _callback_: Function to call once read is complete, first argument is a
    # list of documents matching query.

    read: (query) ->
      query ?= {}
      collection = new LiveDocumentCollection query, @collectionName()
      @sendReadMessage query, _.bind(collection.handleNotification, collection)
      return collection

    # **create** *public*
    # 
    # _document_: Document to create
    #
    # _callback_: Function to call once document is created
   
    create: (document, callback) ->
      if(!callback?)
        callback = () ->

      @createDocumentInstance document
      @sendCreateMessage document, callback
 
    # **update** *public*
    #
    # Important: The update methods will only update ONE document
    # 
    # _query_: conditions with which to find the document to update
    # _document_: Document of updates to make
    #
    # _callback_: Function to call once document has been updated
 
    update: (query, document, callback) ->
      if(!callback?)
        callback = () ->

      @sendUpdateMessage @collectionName(), query, document, callback

    delete: (query, callback) ->
      if(!callback?)
        callback = () ->

      @sendDeleteMessage @collectionName(), query, callback

    # **key** *public* 
    #
    # The key method is called at declaration time. It defines which keys are
    # valid for documents of this type
    #
    # _name_: the name of the key
    #
    # _properties_: validations and other rules pertaining to the key

    key: (name, properties) ->
