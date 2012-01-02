if (typeof define != 'function') then define = (require('amdefine'))(module)
requestCallbackNonce = 0

define ["underscore", "./live_document_collection"], (_, LiveDocumentCollection) ->
  
  # Static methods to do common database tasks
  LiveDocumentClassMethods =

    collectionName: () ->
      _.uncapitalize _.pluralize @modelName

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
      @socket.emit "LiveDocumentCollectionRemove", @collectionName(), query, callback
 
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
      @socket.emit "LiveDocumentUpdate", @collectionName(), query, {$set: document}, callback

    # **read** *public*
    # 
    # _query_: Conditions for the document(s) to find
    #
    # _callback_: Function to call once read is complete, first argument is a
    # list of documents matching query.

    read: (query, callback) ->
      query ?= {}
      callback ?= ->
      collection = new LiveDocumentCollection query, @
      @sendReadMessage query, _.bind(collection.handleNotification, collection)
      collection.on "load", callback
      return collection

    # **create** *public*
    # 
    # _document_: Document to create
    #
    # _callback_: Function to call once document is created
   
    create: (document, callback) ->
      if(!callback?)
        callback = () ->

      doc = new @(document)
      doc.save callback
      return doc
 
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

      instance = new @()
      @sendUpdateMessage query, document, (document) =>
        instance.set(document)
        callback(instance)
      return instance

    # **delete** *public*
    #
    # delete deletes a single document, and calls callback when finished
    delete: (query, callback) ->
      if(!callback?)
        callback = () ->

      instance = new @()
      @sendDeleteMessage query, (document) ->
        instance.set(document)
        callback(instance)
      return instance
    # **key** *public* 
    #
    # The key method is called at declaration time. It defines which keys are
    # valid for documents of this type
    #
    # _name_: the name of the key
    #
    # _properties_: validations and other rules pertaining to the key

    key: (name, properties) ->
      return @

    # This registers a hook that runs before every instance of this type saves
    #
    # The callback will be bound to the instance that is being saved, however,
    # it is also passed in as the second parameter, if you want to bind your
    # function to something else.
    #
    # Examples:
    #     class Thing extends LiveDocument
    #       @beforeSave (done, thing) ->
    #         checkThingTitleIsOkRemotely thing.get("title"), (isOk)
    #           if isOk
    #             done()
    #           else 
    #             done("Couldn't save")
    #
    # @param           {Function} the function that will be called before each save
    # @binding         {LiveDocument} Instance being saved
    # @callbackArg     {Function} Done function, to be called when completed
    # @callbackArg     {LiveDocument} Instance being saved
    beforeSave: (fn) ->
      @beforeSaveFunctions ?= []
      @beforeSaveFunctions.push(fn)
  LiveDocumentClassMethods.find = LiveDocumentClassMethods.read
  return LiveDocumentClassMethods
