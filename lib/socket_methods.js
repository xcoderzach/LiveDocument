var _ = require("underscore")
  , generateObjectId = require("./object_id")

module.exports = function(socket) {
  return {
    collection: function(collectionName) {
      return {
        read: function(query, callback) {
          var id = generateObjectId()
          socket.emit("Read", collectionName, query, id)
          socket.on("Request" + id, function(docs, method) {
            callback(docs, method)
          })
          return id
        }

      , create: function(document, callback) {
          socket.emit("Create", collectionName, document, callback)
        }

      , readOne: function(query, callback) {
          socket.emit("ReadOne", collectionName, query, callback)
        }

      , remove: function(id, callback) {
          socket.emit("Delete", collectionName, id, callback)
        }

      , update: function(query, document, callback) {
          socket.emit("Update", collectionName, query, document, callback)
        }
      }
    }

  , embedded: function(collectionName, parentId, embeddedCollectionName) {
      return {
        update: function(embeddedId, document, callback) {
          socket.emit( "EmbeddedUpdate"
                     , collectionName
                     , parentId
                     , embeddedCollectionName 
                     , embeddedId
                     , document
                     , callback )
        }
      , create: function(document, callback) {
          socket.emit( "EmbeddedCreate"
                     , collectionName
                     , parentId
                     , embeddedCollectionName
                     , document
                     , callback )
        }
      , remove: function(embeddedId, callback) {
          socket.emit( "EmbeddedDelete"
                     , collectionName
                     , parentId
                     , embeddedCollectionName
                     , embeddedId
                     , callback )
        }
      }
    }
  }
}
