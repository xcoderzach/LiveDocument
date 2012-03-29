var Collection           = require("./collection")
  , _                    = require("underscore")
  , socketMethods        = require("./socket_methods")
  , DatabaseMethods      = require("./server/database_methods")

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
  //TODO Collection shouldn't have to know about Model
  var db = this.getDb()
    , collection = new Collection(this)
    , queryId = db.read(query, function(docs) {
        collection.handleNotification(docs, "load")
      })

  collection.once("load", callback)
  //hack to close collections
  collection.setRequestId(queryId)

  return collection
}

ClassMethods.getDb = function() {
  if(this.isServer) {
    if(this.embedded) {
      return DatabaseMethods(this.db).embedded("", "", this.collectionName())
    } else {
      return DatabaseMethods(this.db).collection(this.collectionName())
    }
  } else {
    if(this.embedded) {
      return socketMethods(this.socket).embedded("", "", this.collectionName())
    } else {
      return socketMethods(this.socket).collection(this.collectionName())
    }
  }
} 

ClassMethods.findByKey = function(key, value, callback) {
  var query = {}
  callback = callback || function() {}

  if(typeof value === "undefined") {
    throw new Error("value (or id) can't be undefined")
  }
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
  if(typeof id === "undefined" || id === null) {
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
 *
 * This registers a hook that runs before every instance of this type saves.
 * The function will *ONLY* be run on the client.  The callback will be bound to
 * the instance that is being saved, however, it is also passed in as the first
 * parameter.
 *
 * If anything is passed to the done function, saving fails
 *
 * Examples:
 *     Thing.beforeSave(function(thing, done) {
 *       isOk = checkThingTitleIsOk(thing.get("title"))
 *       done()
 *     })
 *
 * @param           {Function} the function that will be called before each save
 * @binding         {Document} Instance being saved
 * @callbackArg     {Document} Instance being saved
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

ClassMethods.afterSave = function(fn) {
  this.afterSaveFunctions = this.afterSaveFunctions || [] 
  this.afterSaveFunctions.push(fn)
  return this
}

ClassMethods.serverAfterSave = function(fn) {
  this.serverAfterSaveFunctions = this.serverAfterSaveFunctions || [] 
  this.serverAfterSaveFunctions.push(fn)
  return this
}

ClassMethods.afterRemove = function(fn) {
  this.afterRemoves = this.afterRemoves || [] 
  this.afterRemoves.push(fn)
  return this
}

ClassMethods.serverAfterRemove = function(fn) {
  this.serverAfterRemoves = this.serverAfterRemoves || [] 
  this.serverAfterRemoves.push(fn)
  return this
} 

ClassMethods.many = function(associatedModel, opts) {
  this.hasMany = this.hasMany || {}
  opts = opts || {}
  if(opts.dependent) {
    this.setupManyDependent(associatedModel.collectionName())
  }
  this.hasMany[associatedModel.collectionName()] = { model: associatedModel, opts: opts }
  return this
}

ClassMethods.setupManyDependent = function(name) {
  this.serverAfterRemove(function(instance) {
    instance.assoc(name).each(function(items) {
      items.each(function(item) {
        item.remove()
      })
    })
  })
}

ClassMethods.setupOneDependent = function(name) {
  this.serverAfterRemove(function(instance) {
    instance.assoc(name, function(item) {
      item.remove()
    })
  })
}

ClassMethods.one = function(associatedModel, opts) {
  this.hasOne = this.hasOne || {}
  opts = opts || {}
  var name = _.singularize(associatedModel.collectionName())
  if(opts.as) {
    opts.foreignKey = opts.foreignKey || opts.as + "Id"
    name = opts.as
  }
  if(opts.dependent) {
    this.setupOneDependent(name)
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

ClassMethods.getKey = function(key, deps, valueFn) {
  this.dynamicKeyGetters = this.dynamicKeyGetters || {}
  this.dynamicKeyGetters[key] = { deps: deps 
                                , valueFn: valueFn }
  
  return this
}

ClassMethods.setKey = function(key, callback) {
  this.dynamicKeySetters = this.dynamicKeySetters || {}
  this.dynamicKeySetters[key] = callback
  return this
}

//TODO we always have timestamps...is that good?
ClassMethods.timestamps = function() {
  this.timestamps = true
  return this
}
