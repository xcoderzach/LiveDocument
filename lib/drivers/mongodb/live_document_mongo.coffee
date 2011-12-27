define ["cs!lib/drivers/mongodb/conditional_matcher", "cs!lib/drivers/mongodb/database_methods", "underscore"], (ConditionMatcher, DatabaseMethods, _) ->
 
  class LiveDocumentMongo
    @ConditionalMatcher = ConditionMatcher
    # these should both have limitations, to prevent DOS
    @listeners: []
    @ids = {}

    # Takes in a "socket", or any EventEmitter, and a mongodb database connection
    # and listens for updates on the socket
    
    constructor: (socket, connection) ->
      @db = DatabaseMethods connection
      @setSocket socket

    setSocket: (@socket) ->
      @socket.on "LiveDocumentCreate", @handleCreateMessage.bind(@)
      @socket.on "LiveDocumentRead", @handleReadMessage.bind(@)
      @socket.on "LiveDocumentUpdate", @handleUpdateMessage.bind(@)
      @socket.on "LiveDocumentCollectionRemove", @handleDeleteMessage.bind(@)
       
    # Takes in a document and finds all the listeners who would like to be
    # notified about it
    
    matchingListeners: (document) ->
      callbacks = []
      LiveDocumentMongo.listeners.forEach (listener) ->
        { callback, conditions } = listener
        if ConditionMatcher.match(document, conditions)
          callbacks.push callback
      return callbacks

    # Watches a particular id for updates or deletes
    #
    # I have no idea how to make this GC atm, meh

    watchId: (id) ->
      cb = (document, type) =>
        @socket.emit("LiveDocument" + _.capitalize(type) + id, document)
      if Array.isArray(LiveDocumentMongo.ids[id])
        LiveDocumentMongo.ids[id].push cb
      else
        LiveDocumentMongo.ids[id] = [cb]

    # Stop watching an id, right now this makes EVERYONE stop watching
    # this should only be called if you delete the document
    unwatchId: (id) ->
      delete LiveDocumentMongo.ids[id]

    # Notifies everyone who cares about doc id, sends them newDoc
    notifyById: (id, newDoc, type) ->
      _(LiveDocumentMongo.ids[id]).each (cb) ->
        cb(newDoc, type)

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
        @watchId(document._id)
        callback document

    # When we get a read message, get the contents out of the database
    # give them to the requester, and then start listening for any changes
    # that pertain to these conditions
    
    handleReadMessage: (collection, conditions, requestNumber) ->
      @db.read collection, conditions, (arr) =>
        cb = (document, method) =>
          @socket.emit "LiveDocument" + requestNumber, document, method
        cb(arr, "load")
        _(arr).each (doc) =>
          @watchId(doc._id)
        LiveDocumentMongo.listeners.push { callback: cb, conditions: conditions }
                                   
    # When we get an update message, update the document, notify the updater
    # find out which collections are affected, and notify them 
    
    handleUpdateMessage: (collection, conditions, document, callback) ->
      @db.update collection, conditions, document, (oldDocument, newDocument) =>
        #notify the updater
        callback newDocument
        
        @notifyById(newDocument._id, newDocument, "update")

        oldListeners = @matchingListeners oldDocument
        newListeners = @matchingListeners newDocument

        # Documents whose conditions are in oldListeners but not newListeners
        # get remove notifications
        removeNotifications = _(oldListeners).difference newListeners
        # Documents whose conditions are in newListeners but not oldListeners
        # get insert notifications
        insertNotifications = _(newListeners).difference oldListeners

        @notifyListeners removeNotifications, oldDocument, "remove"
        @notifyListeners insertNotifications, newDocument, "insert"
                                     
    # When we get a delete message notify the deleter and all the people who
    # care about it 
    
    handleDeleteMessage: (collection, conditions, callback) ->
      @db.delete collection, conditions, (document) =>
        @notifyById(document._id, document, "delete")
        @unwatchId(document._id)
        @notifyMatchingListeners document, "remove"
        callback document
