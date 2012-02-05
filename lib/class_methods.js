if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["underscore", "./live_document_collection"]
       , function(_, LiveDocumentCollection) {

  var requestCallbackNonce = 0

  LiveDocumentClassMethods = {}

  LiveDocumentClassMethods.isServer = (process.platform !== "browser")

  /** 
   * returns the name of the collection
   */
  LiveDocumentClassMethods.collectionName = function() {
    return _.uncapitalize(_.pluralize(this.modelName))
  }

  LiveDocumentClassMethods.setSocket = function(socket) {
    var that = this
    this.listeners = {}
    this.socket = socket

    this.socket.on("Change", function(id, doc) {
      _(that.listeners[id]).each(function(instance) {
        instance.handleChange(doc)
      })
    })

    this.socket.on("Remove", function(id) {
      _(that.listeners[id]).each(function(instance) {
        instance.handleRemove()
      })
    }) 
     
    this.socket.on("EmbeddedInsert", function(parentName, id, associationName, embeddedDocumentId, doc) {
      _(that.listeners[id]).each(function(instance) {
        instance.manyAssociations[associationName].handleNotification(doc, "insert")
      })
    })

    this.socket.on("EmbeddedRemove", function(parentName, id, associationName, doc) {
      _(that.listeners[id]).each(function(instance) {
        instance.manyAssociations[associationName].handleNotification(doc, "remove")
      })
    }) 
  }

  /*
   * listen for changes and notify interested documents
   * when the changes happen
   */
  LiveDocumentClassMethods.listenForChanges = function(id, instance) {
    var that = this
    this.listeners = this.listeners || {}
    this.listeners[id] = this.listeners[id] || []
    this.listeners[id].push(instance)
  }

  LiveDocumentClassMethods.stopListening = function(id, instance) {
    var listeners = this.listeners[id]
    var index = _(listeners).indexOf(instance)
    if(index != -1) {
      listeners.splice(index, 1)
    }
    if(listeners.length === 0) {
      this.socket.emit("StopListeningId", id)
      delete this.listeners[id]
    }
  }

 /**
  * This method sends a message requesting a document or collection of
  * documents to the server via socket.io or any other class that implements
  * eventEmitter, when the client has received the results call callback
  *
  * @param {Object} query to find the documents
  * @param {Function} callback to call once read
  * @api private
  **/


  LiveDocumentClassMethods.sendReadMessage = function(query, callback) {
    this.socket.emit("Read", this.collectionName(), query, requestCallbackNonce)
    this.socket.on("Request" + requestCallbackNonce, function(docs, method) {
      callback(docs, method)
    })
    return requestCallbackNonce++ 
  }

  /**
   * **sendCreateMessage** *private*
   *
   * This method sends a message containing new document to create to the server
   * via an eventEmitter, socket, when the client has created the document it
   * calls callback
   **/

  LiveDocumentClassMethods.sendCreateMessage = function(document, callback) {
    this.socket.emit("Create", this.collectionName(), document, callback)
  }

 /**
  * **sendDeleteMessage** *private*
  *
  * This method sends a message containing the query to find a document to delete
  */

  LiveDocumentClassMethods.sendDeleteMessage = function(query, callback) {
    this.socket.emit("Delete", this.collectionName(), query, callback)
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
  */

  LiveDocumentClassMethods.sendUpdateMessage = function(query, document, callback) {
    this.socket.emit("Update", this.collectionName(), query, document, callback)
  }

 /**
  * @param {Object} query conditions for the document(s) to find
  *
  * _callback_: Function to call once read is complete, first argument is a
  * list of documents matching query.
  */
  LiveDocumentClassMethods.read = function(query, callback) {
    query = query || {}
    callback = callback || function() {}
    if(this.embedded) {
      throw new Error("Can't use find method on embedded documents (this method shouldn't even be available)")
    }

    var collection = new LiveDocumentCollection(this)
      , queryId = this.sendReadMessage(query, _.bind(collection.handleNotification, collection))

    collection.once("load", callback)
    //hack to close collections
    collection.setRequestId(queryId)

    return collection
  }
 /**
  * @param {Object} query conditions for the document(s) to find
  *
  * @callback: Function to call once read is complete, 
  * @callbackArg: first argument is a list of documents matching query.
  * @callbackBinding: bound to instance
  */ 
  LiveDocumentClassMethods.readOne = function(query, callback) { 
    var that = this
    callback = callback || function() {}

    if(this.embedded) {
      throw new Error("Can't use findOne method on embedded documents (this method shouldn't even be available)")
    }

    if(typeof query === "undefined") {
      throw new Error("findOne requires a query")
    }
    if(typeof query === "string") {
      query = {_id : query}
    }
    var doc = new this({_id: query._id})

    var found = false
    this.sendReadMessage(query, function(docs) {
      if(found) {
        return
      }
      found = true
      if(docs[0]) {
        doc.set(docs[0], {validate: false})
        doc.loaded = true
        doc.saved = true
        doc.persisted = true
        doc.emit("load", doc)
        _(callback).bind(doc)(doc)
      } else {
        callback(new that)
      }
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

  LiveDocumentClassMethods.create = function(document, callback) {
    callback = callback || function() {}

    if(this.embedded) {
      throw new Error("Can't use create method on embedded documents (this method shouldn't even be available)")
    }

    var doc = new this(document)
    doc.save(callback)
    return doc
  }
 /**
  * Important: The update methods will only update ONE document
  * 
  * @param {String} id with which to find the document to update
  * @param {Object} document with updated fields and values
  *
  * @callback call once document has been updated
  * @callbackArg {Object} new object with changes
  */

  LiveDocumentClassMethods.update = function(id, document, callback) {
    callback = callback || function() {}

    if(this.embedded) {
      throw new Error("Can't use update method on embedded documents (this method shouldn't even be available)")
    }

    document._id = id
    var instance = new this(document)
    instance.persisted = true

    instance.save(function() {
      callback(instance)
    })
    return instance
  }

 /*
  * deletes a single document, and calls callback when finished
  */
  LiveDocumentClassMethods.delete = function(query, callback) {
    callback = callback || function() {}

    if(this.embedded) {
      throw new Error("Can't use update method on embedded documents (this method shouldn't even be available)")
    }

    var instance = new this()
    this.sendDeleteMessage(query, function(document) {
      instance.set(document)
      callback(instance)
    })
    return instance
  }

 /**
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

  LiveDocumentClassMethods.key = function(name, properties) {
    this.keys = this.keys || []
    properties = properties || {}
    this.validations = this.validations || {}
    this.validations[name] = this.validations[name] || {}

    this.keys.push(name)
    if(properties.length) {
      this.validations[name].min = properties.length[0]
      this.validations[name].max = properties.length[properties.length.length - 1]
    }
    if(properties.unique) {
      this.validations[name].unique = properties.unique
    }
    if(properties.min) {
      this.validations[name].min = properties.min
    }
    if(properties.max) {
      this.validations[name].max = properties.max
    }
    if(properties.required) {
      this.validations[name].required = properties.required
    }
    if(properties.canRead === false) {
      this.dontRead = this.dontRead || []
      this.dontRead.push(name)
    }
    if(properties.canUpdate === false) {
      this.dontUpdate = this.dontUpdate || []
      this.dontUpdate.push(name)
    }
    
    return this                    
  }

 /** 
  * Scrub removes anything that the client is not allowed to read or write
  * from an array of documents
  *
  * @param {Array} documents to scrub @return {Array} scrubbed documents
  */

  LiveDocumentClassMethods.scrub = function(documents, method) {
    var callback = function() {}
    var notArray = false
    if(!_.isArray(documents)) {
      notArray = true
      documents = [documents]
    }

    var disallowed = (method === "read") ? this.dontRead : this.dontUpdate

    var scrubbedDocuments = _.map(documents, function(document) {
      _.each(document, function(value, key) {
        if(_(disallowed).indexOf(key) !== -1) {
          delete document[key]
        }
      })
      return document
    })
    if(notArray) {
      scrubbedDocuments = scrubbedDocuments[0]
    }
    return scrubbedDocuments
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

  LiveDocumentClassMethods.beforeSave = function(fn) {
    this.beforeSaveFunctions = this.beforeSaveFunctions || [] 
    this.beforeSaveFunctions.push(fn)
    return this
  }

  LiveDocumentClassMethods.serverBeforeSave = function(fn) {
    this.serverBeforeSaveFunctions = this.serverBeforeSaveFunctions || [] 
    this.serverBeforeSaveFunctions.push(fn)
    return this
  }

  LiveDocumentClassMethods.beforeCreate = function(fn) {
    this.beforeCreateFunctions = this.beforeCreateFunctions || [] 
    this.beforeCreateFunctions.push(fn)
    return this
  }

  LiveDocumentClassMethods.serverBeforeCreate = function(fn) {
    this.serverBeforeCreateFunctions = this.serverBeforeCreateFunctions || [] 
    this.serverBeforeCreateFunctions.push(fn)
    return this
  }

  /**
   * Add a new string that specifies which associated users can edit a document 
   *
   * As of right now, only "self" works, since associations haven't been 
   * implemented yet
   *
   * @param {String} associatedUser which is allowed to edit a document
   **/

  LiveDocumentClassMethods.editableBy = function(associatedUser) {
    this.editUsers = this.editUsers || []
    this.editUsers.push(associatedUser)
    return this
  }

  LiveDocumentClassMethods.many = function(associatedModel) {
    this.hasMany = this.hasMany || {}
    this.hasMany[associatedModel.collectionName()] = associatedModel
    return this
  }

  LiveDocumentClassMethods.one = function(associatedModel, opts) {
    this.hasOne = this.hasOne || {}
    this.hasOne[_.singularize(associatedModel.collectionName())] = { model: associatedModel, opts: opts }
    return this
  }

  LiveDocumentClassMethods.belongsTo = function(associatedModel, assocName) {
    assocName = assocName || _.singularize(associatedModel.collectionName())

    this.belongingTo = this.belongingTo || {}
    this.belongingTo[assocName] = associatedModel
    return this
  }
 
  LiveDocumentClassMethods.timestamps = function() {
    this.timestamps = true
    return this
  }
 
  //alias these
  LiveDocumentClassMethods.find = LiveDocumentClassMethods.read 
  LiveDocumentClassMethods.findOne = LiveDocumentClassMethods.readOne

  return LiveDocumentClassMethods
})
