define ["require", "cs!./conditional_matcher", "cs!./database_methods", "underscore"], (require, ConditionMatcher, DatabaseMethods, _) ->
 
  class LiveDocumentMongo

    @listeners: []

    # Takes in a "socket", or any EventEmitter, and a mongodb database connection
    # and listens for updates on the socket
    
    constructor: (@socket) ->
      @db = DatabaseMethods connection

      @socket.on "LiveDocumentCreate", @handleCreateMessage.bind(@)
      @socket.on "LiveDocumentRead", @handleReadMessage.bind(@)
      @socket.on "LiveDocumentUpdate", @handleUpdateMessage.bind(@)
      @socket.on "LiveDocumentDelete", @handleDeleteMessage.bind(@)

    # Takes in a document and finds all the listeners who would like to be
    # notified about it
    
    matchingListeners: (document) ->
      callbacks = []
      LiveDocument.listeners.forEach (listener) ->
        { callback, conditions } = listener
        if ConditionMatcher.match(document, conditions)
          callbacks.push callback
      return callbacks

    # notifies an array of _listeners_ notifying them that
    # _event_ happened to _document_
    # _method_ can be update, delete, insert
    
    notifyListeners: (listeners, document, event) ->
      listeners.forEach (callback) ->
        callback(document, event)

    # Notifies all things that care about 
    # _document_ that _event_ happened to it
    
    notifyMatchingListeners: (document, event) ->
      matching = @matchingListeners(document)
      @notifyListeners(matching, document, event)

    # When we get a create message, create the document and
    # notify the creator and anyone else who cares
    
    handleCreateMessage: (collection, document, callback) ->
      @db.create collection, document, () =>
        @notifyMatchingListeners document, "insert"
        callback document

    # When we get a read message, get the contents out of the database
    # give them to the requester, and then start listening for any changes
    # that pertain to these conditions
    
    handleReadMessage: (collection, conditions, requestNumber) ->
      @db.read collection, conditions, (arr) =>
        cb = (document, method) =>
          @socket.emit "LiveDocument" + requestNumber, document, method
        cb(arr, "load")
        LiveDocument.listeners.push { callback: cb, conditions: conditions }
                                   
    # When we get an update message, update the document, notify the updater
    # find out which collections are affected, and notify them 
    
    handleUpdateMessage: (collection, conditions, document, callback) ->
      @db.update collection, conditions, document, (oldDocument, newDocument) =>
        #notify the updater
        callback newDocument
        
        oldListeners = @matchingListeners oldDocument
        newListeners = @matchingListeners newDocument

        # Documents whose conditions matched the oldDocument and the newDocument
        # get update notifications
        #
        # We should probably send update notices for each document individually
        # the collection shouldn't handle a document being updated
        updateNotifications = _.intersection oldListeners, newListeners
        # Documents whose conditions are in oldListeners but not newListeners
        # get remove notifications
        removeNotifications = _(oldListeners).difference newListeners
        # Documents whose conditions are in newListeners but not oldListeners
        # get insert notifications
        insertNotifications = _(newListeners).difference oldListeners

        @notifyListeners updateNotifications, newDocument, "update"
        @notifyListeners removeNotifications, oldDocument, "delete"
        @notifyListeners insertNotifications, newDocument, "insert"
                                     
    # When we get a delete message notify the deleter and all the people who
    # care about it 
    
    handleDeleteMessage: (collection, conditions, callback) ->
      @db.delete collection, conditions, (document) ->
        @notifyMatchingListeners document, "delete"
        callback document
