define () ->
  return (db)->
    DatabaseMethods =
      # **create** *private* 
      #
      # Inserts the document specified, and calls the callback with
      # the document once it finishes.
      #
      create: (collectionName, document, callback) ->
        collection = db.collection(collectionName)
        collection.insert document, (err, doc) ->
          callback document
     
      # **read** *private* 
      #
      # Finds all the documents that match conditions and passes them into
      # callback as and array once they all have been found.
      #
      read: (collectionName, conditions, callback) ->
        collection = db.collection(collectionName)
        collection.find(conditions).toArray (err, arr) ->
          callback arr

      # **update** *private* 
      #
      # Updates first document matching conditions with document calls callback
      # with the old document and the new one.
      #
      # callback(oldDocument, newDocument)
      #
      update: (collectionName, conditions, document, callback) ->
        collection = db.collection(collectionName)
        collection.findAndModify { query: conditions, update: document }, (err, oldDoc) ->
          # the findAndModify finds the old document findOne finds the new
          # we'll use this later to find out if the update removed the document
          # from the a collection, added it, or just changed it.
          collection.findOne { _id: oldDoc._id }, (err, newDoc) ->
            callback oldDoc, newDoc

      # **delete** *private* 
      #
      # Deletes the first document matching conditions 
      # calls callback with the old document.
      #
      # callback(oldDocument)
      #
      delete: (collectionName, conditions, callback) ->
        collection = db.collection(collectionName)
        collection.findAndModify { query: conditions, remove: true }, (err, doc) ->
          callback doc
