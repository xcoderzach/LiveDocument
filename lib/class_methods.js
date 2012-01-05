if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["require", "underscore", "./live_document_collection"]
       , function(require, _, LiveDocumentCollection) {

  var requestCallbackNonce = 0

  /**
    * The static methods 
    **/
  var LiveDocumentClassMethods = {
    collectionName: function() {
      return _.uncapitalize(_.pluralize(this.modelName))
    }
   /**
    * **sendReadMessage** *private*
    *
    * This method sends a message requesting a document or collection of
    * documents to the server via socket.io or any other class that implements
    * eventEmitter, when the client has received the results call callback
    **/

  , sendReadMessage: function(query, callback) {
      this.socket.emit("LiveDocumentRead", this.collectionName(), query, requestCallbackNonce)
      this.socket.on("LiveDocument" + requestCallbackNonce, function(docs, method) {
        callback(docs, method)
      })
      requestCallbackNonce += 1
    }

   /**
    * **sendCreateMessage** *private*
    *
    * This method sends a message containing new document to create to the server
    * via an eventEmitter, socket, when the client has created the document it
    * calls callback
    **/

  , sendCreateMessage: function(document, callback) {
      this.socket.emit("LiveDocumentCreate", this.collectionName(), document, callback)
    }

   /**
    * **sendDeleteMessage** *private*
    *
    * This method sends a message containing the query to find a document to delete
    **/

  , sendDeleteMessage: function(query, callback) {
      this.socket.emit("LiveDocumentCollectionRemove", this.collectionName(), query, callback)
    }

   /**
    * **sendUpdateMessage** *private*
    *
    * _query_: The document to update 
    *
    * _document_: the new keys/values to add/change
    *
    * This method sends a message to update a single document that matches query
    * via an eventEmitter, socket, when the client has created the document it
    * calls callback 
    **/

  , sendUpdateMessage: function(query, document, callback) {
      this.socket.emit("LiveDocumentUpdate", this.collectionName(), query, {$set: document}, callback)
    }

   /**
    * **read** *public*
    * 
    * _query_: Conditions for the document(s) to find
    *
    * _callback_: Function to call once read is complete, first argument is a
    * list of documents matching query.
    */
  , read: function(query, callback) {
      query = query || {}
      callback = callback || function() {}
      var collection = new LiveDocumentCollection(query, this)

      this.sendReadMessage(query, _.bind(collection.handleNotification, collection))
      collection.on("load", callback)
      return collection
    }

  , findOne: function(id, callback) { 
      var doc = new this({_id: id})
      this.sendReadMessage({_id: id}, function(docs) {
        doc.set(docs[0])
        callback(doc)
      })
      return doc
    }
   /**
    * **create** *public*
    * 
    * _document_: Document to create
    *
    * _callback_: Function to call once document is created
    **/
   
  , create: function(document, callback) {
      if(!typeof callback === "function") {
        callback = function() {}
      }

      var doc = new this(document)
      doc.save(callback)
      return doc
    }
   /**
    ***update** *public*
    *
    * Important: The update methods will only update ONE document
    * 
    * _query_: conditions with which to find the document to update
    * _document_: Document of updates to make
    *
    * _callback_: Function to call once document has been updated
    */

  , update: function(query, document, callback) {
      if(typeof callback !== "function") {
        callback = function() {}
      }

      var instance = new this()
      this.sendUpdateMessage(query, document, function(document) {
        instance.set(document)
        callback(instance)
      })
      return instance
    }

   /*
    * deletes a single document, and calls callback when finished
    */
  , delete: function(query, callback) {
      if(typeof callback !== "function") {
        callback = function() {}
      }

      var instance = new this()
      this.sendDeleteMessage(query, function(document) {
        instance.set(document)
        callback(instance)
      })
      return instance
    }

   /*
    * The key method is called at declaration time. It defines which keys are
    * valid for documents of this type.
    *
    * Examples:
    *     Thing.key("title", { length: [5,24], required: true })
    *
    * @param {String} name of the key
    * @param {Object} properties validations and other rules pertaining to the key
    * @return {LiveDocument} the instance, for chaining
    * @api public
    */

  , key: function(name, properties) {
      properties = properties || {}
      this.validations = this.validations || {}
      this.validations[name] = this.validations[name] || {}
      if(properties.length) {
        this.validations[name].min = properties.length[0]
        this.validations[name].max = properties.length[properties.length.length - 1]
      }
      if(properties.unique) {
        this.validations[name].unique = properties.unique
      }
      
      return this                    
    }

   /**
    * This registers a hook that runs before every instance of this type saves
    *
    * The callback will be bound to the instance that is being saved, however,
    * it is also passed in as the first parameter.
    *
    * Examples:
    *     Thing.beforeSave(function(done, thing) {
    *       isOk = checkThingTitleIsOk(thing.get("title"))
    *       done(isOk)
    *     })
    *
    * @param           {Function} the function that will be called before each save
    * @binding         {LiveDocument} Instance being saved
    * @callbackArg     {LiveDocument} Instance being saved
    * @callbackArg     {Function} Done function, to be called when completed
    * @api public
    **/
    
  , beforeSave: function(fn) {
      this.beforeSaveFunctions = this.beforeSaveFunctions || []
      this.beforeSaveFunctions.push(fn)
    }
  }
  LiveDocumentClassMethods.find = LiveDocumentClassMethods.read 
  return LiveDocumentClassMethods

})
