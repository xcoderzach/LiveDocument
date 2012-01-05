  module.exports = function(db) {
    return {
     /*
      * **create** *private* 
      *
      * Inserts the document specified, and calls the callback with
      * the document once it finishes.
      */
      create: function(collectionName, document, callback) {
        var collection = db.collection(collectionName)
        collection.insert(document, function(err, doc) {
          callback(document)
        })
      }
     
     /*
      * **read** *private* 
      *
      * Finds all the documents that match conditions and passes them into
      * callback as and array once they all have been found.
      */
    , read: function(collectionName, conditions, callback) {
        var collection = db.collection(collectionName)
        collection.find(conditions).toArray(function(err, arr) {
          callback(arr)
        })
      }
     /*
      * **update** *private* 
      *
      * Updates first document matching conditions with document calls callback
      * with the old document and the new one.
      *
      * callback(oldDocument, newDocument)
      */
    , update: function(collectionName, conditions, document, callback) {
        var collection = db.collection(collectionName)
        collection.findAndModify({ query: conditions, update: document }, function(err, oldDoc) {
          // the findAndModify finds the old document findOne finds the new
          // we'll use this later to find out if the update removed the document
          // from the a collection, added it, or just changed it.
          collection.findOne({ _id: oldDoc._id }, function(err, newDoc) {
            callback(oldDoc, newDoc)
          })
        })
      }
     /*
      * **delete** *private* 
      *
      * Deletes the first document matching conditions 
      * calls callback with the old document.
      *
      * callback(oldDocument)
      */
    , delete: function(collectionName, conditions, callback) {
        var collection = db.collection(collectionName)
        collection.findAndModify({ query: conditions, remove: true }, function(err, doc) {
          callback(doc)
        })
      }
    }
  }