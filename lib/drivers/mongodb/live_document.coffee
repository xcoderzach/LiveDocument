define ["require", "cs!./conditional_matcher", "cs!./database_methods"], (require, ConditionMatcher, DatabaseMethods) ->

  listeners = []
  return (socket, collection) ->

    db = DatabaseMethods(collection)

    notifyListeners = (document) ->
      listeners.forEach (listener) ->
        { findRequestCallback, conditions } = listener
        if ConditionMatcher.match(document, conditions)
          db.read conditions, (arr) ->
            console.log()
            findRequestCallback arr

    socket.on "LiveDocumentCreate", (collection, document, callback) ->
      db.create document, (document) ->
        callback document
        notifyListeners document
   
    socket.on "LiveDocumentRead", (collection, conditions, requestNumber) ->
      db.read conditions, (arr) ->
        cb = (array) ->
          socket.emit "LiveDocument" + requestNumber, array
        cb(arr)
        listeners.push { findRequestCallback: cb, conditions: conditions }

    socket.on "LiveDocumentUpdate", (collection, conditions, document, callback) ->
      db.update conditions, document, (newDocument) ->
        callback newDocument
        notifyListeners newDocument

    socket.on "LiveDocumentDelete", (collection, conditions, callback) ->
      db.delete conditions, (newDocument) ->
        callback newDocument
        notifyListeners newDocument
