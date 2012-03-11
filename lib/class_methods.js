var Collection           = require("./collection")
  , _                    = require("underscore")
  , requestCallbackNonce = 0

ClassMethods = {}

module.exports = ClassMethods

ClassMethods.isServer = (process.platform !== "browser")

/** 
 * returns the name of the collection
 */
ClassMethods.collectionName = function() {
  return _.uncapitalize(_.pluralize(this.modelName))
}

ClassMethods.setSocket = function(socket) {
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
   
  this.socket.on("EmbeddedInsert", function(parentName, id, associationName, doc) {
    _(that.listeners[id]).each(function(instance) {
      instance.manyAssociations[associationName]().handleNotification(doc, "insert")
    })
  })

  this.socket.on("EmbeddedRemove", function(parentName, id, associationName, doc) {
    _(that.listeners[id]).each(function(instance) {
      instance.manyAssociations[associationName]().handleNotification(doc, "remove")
    })
  }) 
}

/*
 * listen for changes and notify interested documents
 * when the changes happen
 */
ClassMethods.listenForChanges = function(id, instance) {
  var that = this
  this.listeners = this.listeners || {}
  this.listeners[id] = this.listeners[id] || []
  this.listeners[id].push(instance)
}

ClassMethods.stopListening = function(id, instance) {
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

ClassMethods.sendReadMessage = function(query, callback) {
  this.socket.emit("Read", this.collectionName(), query, requestCallbackNonce)
  this.socket.on("Request" + requestCallbackNonce, function(docs, method) {
    callback(docs, method)
  })
  return requestCallbackNonce++ 
}

ClassMethods.sendReadOneMessage = function(query, callback) {
  this.socket.emit("ReadOne", this.collectionName(), query, callback)
}

/**
 * **sendCreateMessage** *private*
 *
 * This method sends a message containing new document to create to the server
 * via an eventEmitter, socket, when the client has created the document it
 * calls callback
 **/

ClassMethods.sendCreateMessage = function(document, callback) {
  this.socket.emit("Create", this.collectionName(), document, callback)
}

/**
* **sendDeleteMessage** *private*
*
* This method sends a message containing the query to find a document to delete
*/

ClassMethods.sendDeleteMessage = function(query, callback) {
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

ClassMethods.sendUpdateMessage = function(query, document, callback) {
  this.socket.emit("Update", this.collectionName(), query, document, callback)
}

/**
* @param {Object} query conditions for the document(s) to find
*
* _callback_: Function to call once read is complete, first argument is a
* list of documents matching query.
*/
ClassMethods.find = function(query, callback) {
  query = query || {}
  callback = callback || function() {}
  if(this.embedded) {
    throw new Error("Can't use find method on embedded documents (this method shouldn't even be available)")
  }

  var collection = new Collection(this)
    , queryId = this.sendReadMessage(query, _.bind(collection.handleNotification, collection))
  collection.once("load", callback)
  //hack to close collections
  collection.setRequestId(queryId)

  return collection
}

ClassMethods.findByKey = function(key, value, callback) {
  var query = {}
  callback = callback || function() {}

  if(value !== null && typeof value === "object") {
    throw new Error("value can't be an object")
  }
  if(typeof callback !== "function") {
    throw new Error("callback must be a function")
  }

  query[key] = value
  var doc = new this(query, {noId: true})
  doc.load(callback)
  doc.fetch()
  return doc
}

/**
 * @param {Object} query conditions for the document(s) to find
 *
 * @callback: Function to call once read is complete, 
 * @callbackArg: first argument is a list of documents matching query.
 * @callbackBinding: bound to instance
 */ 
ClassMethods.findOne = function(id, callback) {
  if(typeof id === "undefined") {
    throw new Error("findOne requires a query")
  }
  return this.findByKey("_id", id, callback)
}
/**
* **create** *public*
* 
* _document_: Document to create
*
* _callback_: Function to call once document is created
**/

ClassMethods.create = function(document, callback) {
  callback = callback || function() {}

  if(this.embedded) {
    throw new Error("Can't use create method on embedded documents (this method shouldn't even be available)")
  }

  var doc = new this(document)
  doc.save(callback)
  return doc
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
* @return {} the instance, for chaining
* @api public
*/

ClassMethods.key = function(name, properties) {
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
  if(properties.isInt === true) {
    this.validations[name].isInt = properties.isInt
  }
  
  return this                    
}

/** 
* Scrub removes anything that the client is not allowed to read or write
* from an array of documents
*
* @param {Array} documents to scrub @return {Array} scrubbed documents
*/

ClassMethods.scrub = function(documents, method) {
  var callback = function() {}
  var notArray = false
  if(!_.isArray(documents)) {
    notArray = true
    documents = [documents]
  }

  var disallowed = (method === "read") ? this.dontRead : this.dontUpdate

  var scrubbedDocuments = _.map(documents, function(document) {
    document = _(document).clone()
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
* @binding         {} Instance being saved
* @callbackArg     {} Instance being saved
* @callbackArg     {Function} Done function, to be called when completed
* @api public
**/

ClassMethods.beforeSave = function(fn) {
  this.beforeSaveFunctions = this.beforeSaveFunctions || [] 
  this.beforeSaveFunctions.push(fn)
  return this
}

ClassMethods.serverBeforeSave = function(fn) {
  this.serverBeforeSaveFunctions = this.serverBeforeSaveFunctions || [] 
  this.serverBeforeSaveFunctions.push(fn)
  return this
}

ClassMethods.beforeCreate = function(fn) {
  this.beforeCreateFunctions = this.beforeCreateFunctions || [] 
  this.beforeCreateFunctions.push(fn)
  return this
}

ClassMethods.serverBeforeCreate = function(fn) {
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

ClassMethods.editableBy = function(associatedUser) {
  this.editUsers = this.editUsers || []
  this.editUsers.push(associatedUser)
  return this
}

ClassMethods.many = function(associatedModel, opts) {
  this.hasMany = this.hasMany || {}
  opts = opts || {}
  this.hasMany[associatedModel.collectionName()] = { model: associatedModel, opts: opts}
  return this
}

ClassMethods.one = function(associatedModel, opts) {
  this.hasOne = this.hasOne || {}
  var name = _.singularize(associatedModel.collectionName())
  if(opts && opts.as) {
    opts.foreignKey = opts.foreignKey || opts.as + "Id"
    name = opts.as
  }
  this.hasOne[name] = { model: associatedModel, opts: opts }
  return this
}

ClassMethods.belongsTo = function(associatedModel, assocName) {
  assocName = assocName || _.singularize(associatedModel.collectionName())

  if(_.isArray(associatedModel)) {
    var modelMap = {}
    _(associatedModel).each(function(Model) {
      modelMap[_.uncapitalize(Model.modelName)] = Model
    })
    this.belongingTo = this.polymorphicBelongingTo || {}
    this.belongingTo[assocName] = { polymorphic: true, models: modelMap }
  } else {
    this.belongingTo = this.belongingTo || {}
    this.belongingTo[assocName] = { model: associatedModel }
  }
  return this
}

ClassMethods.timestamps = function() {
  this.timestamps = true
  return this
}

//alias these
