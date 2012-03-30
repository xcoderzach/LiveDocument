var _ = require("underscore")

module.exports = function(db, ChangeDispatch) {
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
            ChangeDispatch.notifyQueryChange(document, "insert", collectionName)
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

          collection.findAndModify({ query: conditions, update: { $set: document } }, function(err, oldDoc) {
            var newDoc = _.extend({}, oldDoc, document)
            callback(newDoc)
            ChangeDispatch.notifyQueryDiff(oldDoc, newDoc, collectionName)
            ChangeDispatch.notifyIdChange(id, newDoc, "change", collectionName)
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
          collection.findAndModify({ query: { _id: conditions }, remove: true }, function(err, doc) {
            ChangeDispatch.notifyIdChange(conditions, doc, "remove", collectionName)
            ChangeDispatch.notifyQueryChange(doc, "remove", collectionName)
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
            ChangeDispatch.notifyIdChange(parentId, document, "insert", collectionName, embeddedCollectionName)
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
            ChangeDispatch.notifyIdChange(parentId, document, "change", collectionName, embeddedCollectionName)
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
            ChangeDispatch.notifyIdChange(parentId, { _id: id }, "remove", collectionName, embeddedCollectionName)
          })
        }
      }
    }
  }
}
