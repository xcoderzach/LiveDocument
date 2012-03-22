var _ = require("underscore")

module.exports = function(db) {
  return {
    collection: function(collectionName) {
      return {
       /*
        * **create** *private* 
        *
        * Inserts the document specified, and calls the callback with
        * the document once it finishes.
        */
        create: function(document, callback) {
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
      , read: function(conditions, callback) {
          var collection = db.collection(collectionName)
          collection.find(conditions).toArray(function(err, arr) {
            callback(arr)
          })
        }

      , readOne: function(conditions, callback) {
          var collection = db.collection(collectionName)
          collection.findOne(conditions, function(err, doc) {
            callback(doc)
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
      , update: function(id, document, callback) {
          var conditions = { _id: id }
            , collection = db.collection(collectionName)

          KILL THE SERVER DERP HERP DIE SERVERRRRRR
          collection.findAndModify({ query: conditions, update: { $set: document } }, function(err, oldDoc) {
            var newDoc = _.extend(oldDoc, document)
            callback(oldDoc, newDoc)
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
      , remove: function(conditions, callback) {
          var collection = db.collection(collectionName)
          collection.findAndModify({ query: conditions, remove: true }, function(err, doc) {
            callback(doc)
          })
        }
      }
    }
  , embedded: function(collectionName, parentId, embeddedCollectionName) {
      return {
       /*
        * Inserts the embedded document specified, and calls the callback with
        * the document once it finishes.
        *
        * @api private
        */
        createEmbedded: function(document, callback) {
          parentId = document.parentId
          collectionName = document.parentType

          var collection = db.collection(collectionName)
            , push = {}
          push[embeddedCollectionName] = document
          collection.findAndModify({ query: { _id: parentId }, update: { $push: push }, new: true}, function(err, oldDoc) {
            callback(document)
          })
        } 
       /*
        * Inserts the embedded document specified, and calls the callback with
        * the document once it finishes.
        *
        * @api private
        */
      , updateEmbedded: function(id, document, callback) {
          var collection = db.collection(collectionName)
            , condition = {}
            , update = {}
          condition[embeddedCollectionName + '._id'] = id

          _(document).each(function(value, key) {
            update[embeddedCollectionName + ".$." + key] = value
          })

          collection.update(condition, { $set: update }, function(err) {
            callback(document)
          })
        } 

       /*
        * Deletes the embedded document that matches conditions, and calls the callback with
        *
        * the document once it finishes.
        *
        * @api private
        */
      , removeEmbedded: function(id, callback) {
          var collection = db.collection(collectionName)
            , pull = {}
          pull[embeddedCollectionName] = { _id: id }
          collection.findAndModify({ query: { _id: parentId }, update: { $pull: pull } }, function(err, oldDoc) {
            callback()
          })
        }
      }
    }
  }
}
