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
          try
            if err
              console.log err.message
              console.log err.stack
            else
                callback document
          catch e
            console.log e.stack
     
      # **read** *private* 
      #
      # Finds all the documents that match conditions and passes them into
      # callback as and array once they all have been found.
      #
      read: (collectionName, conditions, callback) ->
        collection = db.collection(collectionName)
        collection.find(conditions).toArray (err, arr) ->
          try
            if err
              console.log err.message
              console.log err.stack
            else
              callback arr
          catch e
            console.log e.stack

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
          try
            if err
              console.log err.message
              console.log err.stack
            else
              # the findAndModify finds the old document findOne finds the new
              # we'll use this later to find out if the update removed the document
              # from the a collection, added it, or just changed it.
              
              collection.findOne { _id: oldDoc._id }, (err, newDoc) ->
                try
                  if err
                    console.log err.message
                    console.log err.stack
                  else
                    callback oldDoc, newDoc
                catch e
                  console.log e.stack
          catch e
            console.log e.stack

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
          try
            if err
              console.log err.message
              console.log err.stack
            else
              callback doc
          catch e
            console.log e.stack
