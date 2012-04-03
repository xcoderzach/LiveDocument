var generateObjectId   = require("./object_id")
  , EmbeddedCollection = require("./embedded_collection")
  , socketMethods      = require("./socket_methods")
  , _                  = require("underscore")
  , idCounter = 0 

require("./utils")

var InstanceMethods = {

  /** 
   * The constructor for a new instance of LiveDocument
   *
   * The only valid opts param at the moment is validate false, if you don't
   * want the document to be validated it would be nice if we could pass in
   * saved, persisted and loaded as well
   *
   * This will create a new user which has not been persisted to the
   * database, saved, or loaded, and it is automatically assigned an id
   *
   * It is also used internally to create new documents that are received 
   * from the server, except the loaded, saved, and persisted flags are
   * manually set, and it's not validated
   *
   * Examples: 
   *     user = new User({ name: "Zach" })
   *
   **/

  constructor: function(document, opts) {
    var that = this
    var opts = opts || {}

    document = document || {}
    this.document = {}
    this.id = idCounter++

    this.deleted = false
    this.saved = false
    this.saving = false
    this.persisted = false
    this.loaded = false
    this.alreadyChanging = false

    this.unsavedChanges = []

    this.modelName = this.constructor.modelName

    if(!opts.noId) {
      this.document._id = document._id || generateObjectId()
    }
    this.collectionName = this.constructor.collectionName()
    this.setupDynamicKeys()
    this.setupAssociations()
    this.set(document)

    if(this.get("_id")) {
      this.constructor.listenForChanges(this.get("_id"), this)
    } else {
      this.once("change:_id", function() {
        that.constructor.listenForChanges(this.get("_id"), that)
      })
    }
  }             
  /*
   * Setup all of the keys that were defined with the .getKey and .setKey methods.
   *
   * @api private
   */
, setupDynamicKeys: function() {
    var that = this
    this.dynamicKeyDeps = {}
    this.dynamicKeyGetters = {}
    this.dynamicKeySetters = this.constructor.dynamicKeySetters || {}

    _(this.constructor.dynamicKeyGetters).each(function(getter, key) {
      _(getter.deps).each(function(dep) {
        that.dynamicKeyDeps[dep] = that.dynamicKeyDeps[dep] || []
        that.dynamicKeyDeps[dep].push(key)
        that.dynamicKeyGetters[key] = getter.valueFn
      })
    })
  }

  /*
   * Fetches a document from the database by _id, the document must have
   * an _id set.  Sets the values it retrieves and sets the loaded and
   * saved attributes.  A user should never have to call this method, 
   * since their documents should always be up to date, maybe in the
   * future if there is a "non-realtime" document it would be more useful
   * for now it's just an internal method.
   *
   * @api private
   */
, fetch: function() {
    var that = this
    var db = this.getDb()
    db.readOne(this.document, function(document) {
      if(document) {
        //TODO don't set things that have already been set,
        //because we don't want to overwrite changes a user may
        //have made before the document was loaded
        that.set(document, { validate: false, initialize: true })
        that.loaded = true
        that.saved = true
        that.persisted = true
        that.emit("load", that) 
      } else {
        that.emit("notExist", that)
      }
    })
  }
  /**
   * sets up the many associations, it creates a function that
   * can be called by the .assoc method in order to get an associated document.
   *  
   * the function it creates returns a colletion right away, however, it does
   * not start retrieving the collection from the server until the parent document
   * has loaded, so we actually know which _id the foriegn key should have.
   *
   * If it's an embedded document is pulls the documents out of the document object
   * and puts them into the collection.
   *
   * @api private
   */
, setupManyAssociations: function() {
    var that = this
    this.manyAssociations = {}

    _(this.constructor.hasMany).each(function(obj, collectionName) {
      var collection
        , Model = obj.model
        , opts = obj.opts
      that.manyAssociations[collectionName] = function(callback) {
        var docs
          , query
          , callback = callback || function() {}

        if(collection) {
          callback.call(that, collection)
          return collection
        }
        if(Model.embedded) {
          docs = that.document[collectionName] || []
          delete that.document[collectionName]
          collection = new EmbeddedCollection(Model, {parentType: that.collectionName, parentId: that.get("_id") })
          //TODO make sure that _id is ALWAYS the first property set
          //on the parent id, so that it happens before the hasMany
          //embedded assocs are set
          that.on("change:_id", function() {
            collection.parentId = that.get("_id") 
          })
          that.load(function() {
            if(collection.length === 0) {
              collection.handleLoad([])
            }
          })
        } else {
          query = {}
          query[opts.foreignKey || _.singularize(that.collectionName) + "Id"] = that.get("_id")
          collection = Model.find(query)
        } 
        collection.load(function() {
          callback.call(this, collection)
        })
        return collection
      } 
    })
  }
  /**
   * Sets up a has one association, which returns the document right away but defers 
   * fetching the documents properties until the parent has loaded.
   *  
   * if the document does not exist it gives the instance it returns an _id.  It does
   * not, however actually save the associated document it returns.
   *
   * @api private
   */
, setupOneAssociations: function() {
    var that = this
    this.oneAssociations = {}
    _(this.constructor.hasOne).each(function(obj, collectionName) {
      var Model = obj.model
        , opts = obj.opts || {}
        , foreignKey = opts.foreignKey || _.singularize(that.collectionName) + "Id"

        , model

      that.oneAssociations[collectionName] = function(cb) {
        if(model) {
          cb(model)
          return model
        }
        var callbackCalled = false
        model = new Model({}, {noId: true})

        that.load(function() {
          model.set(foreignKey, that.get("_id"))
          model.fetch()
        })
        //we couldn't find the model
        model.once("notExist", function(err) {
          if(!callbackCalled) {
            callbackCalled = true
            //give the model an id and return it, it hasn't been saved yet, 
            //but that's probably ok.
            model.set("_id", generateObjectId())
            cb(model)
          }
        })
        model.load(function() {
          if(!callbackCalled) {
            callbackCalled = true
            cb(model)
          }
        })
        return model
      }
    })
  }
/**
 * This method returns a document instance of the associated document,
 * if the document does not exist it throws an error, since the document _id
 * in the foreign key doesn't exist which should probably never happen, and
 * means that something probably wasn't deleted properly or is having the wrong
 * foreign key set.
 *
 * @api private
 */
, setupBelongsToAssociations: function() {
    var that = this
    this.belongAssociations = {}
    _(this.constructor.belongingTo).each(function(opts, collectionName) {
      that.belongAssociations[collectionName] = function(cb) {
        var ModelMap = opts.models
          , Model
          , foreignType
          , foreignKey = collectionName + "Id"

        if(opts.polymorphic) {
          foreignType = that.get(collectionName + "Type")
          Model = ModelMap[foreignType] 
        } else {
          Model = opts.model
        }
        var model = new Model({}, {noId: true})
          , assocFetched = false
          , fetchAssoc = function() {
              if(!assocFetched) {
                assocFetched = true
                model.set("_id", that.get(foreignKey))
                model.fetch()
              }
            }
        if(!that.get(foreignKey)) {
          that.load(fetchAssoc)
          that.once("change:" + foreignKey, fetchAssoc)
        } else {
          fetchAssoc()
        }
        
        that.load(fetchAssoc)

        model.once("notExist", function(err) {
          throw new Error("Can't access non existant belongs to association " + collectionName + " from " + that.modelName + ".")
        })
        model.load(function() {
          cb(model)
        })
        return model
      }

    })
       
  }

  /**
   * calls the three setupAssoc methods
   *
   * @api private
   */
, setupAssociations: function() {
    this.setupManyAssociations()
    this.setupOneAssociations()
    this.setupBelongsToAssociations()
  }

  /**
   * stop listening for changes on this document.
   * after this is called no more realtime updates will be
   * received for this document.
   *
   * @api private
   */
, stopListening: function() {
    this.constructor.stopListening(this.get("_id"), this)
  }

 /*
  * listen for changes to documents with this id
  * since it's coming from the server we'll assume
  * it validates 
  *
  * @api private
  */
, handleChange: function(changes) {
    this.set(changes, {validate: false, initialize:true})
  }

 /*
  * listens for this document having been deleted, if it has
  * emit the delete event and set the deleted attribute to false
  *
  * @api private
  */
, handleRemove: function() {
    this.deleted = true
    this.emit("delete", this)
  }  
   
  /*
   * Sends the actual update method via the db, that means it send
   * it to the socket on the client or it send it to the database
   * on the server.
   *
   * This method is overridden by embedded documents, since they
   * have a different method of updating
   *
   * @api private
   */

, sendUpdate: function(query, document, callback) {
    var db = this.getDb()
    db.update(this.get("_id"), document, callback) 
  }

  /** 
   * Gets the database, if we're running on the client, that means a socket connection,
   * if we're on the server it's the actual database methods to do the saving.
   */

, getDb: function() {
    if(this.constructor.isServer) {
      if(this.embedded) {
        return this.db.embedded(this.get("parentType"), this.get("parentId"), this.collectionName)
      } else {
        return this.db.collection(this.collectionName)
      }
    } else {
      if(this.embedded) {
        return socketMethods(this.constructor.socket).embedded(this.get("parentType"), this.get("parentId"), this.collectionName)
      } else {
        return socketMethods(this.constructor.socket).collection(this.collectionName)
      }
    }
  }

  /**
   * This method sends the create message to the server
   * or actually performs the create if called on the server
   *
   * Overridden for embedded documents
   *
   * @api private
   */

, sendCreate: function(document, callback) {
    var db = this.getDb()
    db.create(document, callback)
  }

  /**
   * call all of the correct after(Create|Update|Save) methods
   *
   * @api private
   */

, doAfterHooks: function(type) {
    var callbacks = []
      , that = this
    
    if(!this.constructor.isServer) {
      callbacks = callbacks.concat(this.constructor.afterSaves || [])
      if(type === "create") {
        callbacks = callbacks.concat(this.constructor.afterCreates || [])
      } else if(type === "update") {
        callbacks = callbacks.concat(this.constructor.afterUpdates || [])
      }
    } else {
      callbacks = callbacks.concat(this.constructor.serverAfterSaves || [])
      if(type === "create") {
        callbacks = callbacks.concat(this.constructor.serverAfterCreates || [])
      } else if(type === "update") {
        callbacks = callbacks.concat(this.constructor.serverAfterUpdates || [])
      }
    }
    _(callbacks).each(function(callback) {
      callback.call(that, that)
    })
  }

  /** 
   * this is where the actual saving is performed, this is called by .save, after
   * all before hooks have been called and validation passes.
   *
   * @api private
   **/

, performSave: function(cb) {
    var that = this
      , doc
      , time = (new Date).getTime()

    this.set("updatedAt", time)

    this.saving = true
    this.emit("saving", that)

    //if the document has not been already persisted to the database before
    //then its a create event
    //
    
    //TODO refactor this out!
    if(!this.persisted) {
      this.set("createdAt", time)
      this.unsavedChanges = []
      this.sendCreate(this.document, function() {
        that.doAfterHooks("create")

        that.saving = false
        that.saved = true
        that.persisted = true  
        if(!that.loaded) {
          that.loaded = true
          that.emit("load", that)
        }
         
        that.emit("saved", that)
        cb(that)
      })
    //TODO refactor this out!
    } else {
      var doc = {}
        , changed = _.clone(this.unsavedChanges)

      _(changed).each(function(key) {
        if(key === "_id") {
          return
        }

        that.emit("saving:" + key, that)
        doc[key] = that.document[key]
      })

      this.unsavedChanges = []
      this.sendUpdate({ _id: that.get("_id") }, doc, function() {
        that.lastPersisted = _.clone(that.document)
        that.saved = true
        that.saving = false

        that.doAfterHooks("update")

        cb(that)
        _(changed).each(function(key) {
          if(key !== "_id") {
            that.emit("saved:" + key, that)
          }
        })
        that.emit("saved", that)
      })
    }
  }
   
 /** 
  * Save will create the document on the server if it has not yet been
  * persisted to the database, otherwise it will update the version in the
  * database, calls the callback with itself, returns itself for chaining
  *
  * @parameter cb callbacks first parameter is the document instance
  * called once the document has finished saving.
  *
  * @return self
  * @api public
  */

, save: function(cb) {
    cb = cb || function() {}
    var that = this
      , doc
      , callNext
      , beforeSaves = []
      , beforeSave

    if(!this.document._id) {
      throw new Error("document doesn't have an _id, maybe it hasn't loaded yet?")
    }

    if(this.constructor.isServer) {
      //it's a create save
      if(!this.persisted) {
        beforeSaves.push.apply(beforeSaves, that.constructor.serverBeforeCreateFunctions || [])
      }
      beforeSaves.push.apply(beforeSaves, that.constructor.serverBeforeSaveFunctions || [])
    } else {
      if(!this.persisted) {
        beforeSaves.push.apply(beforeSaves, that.constructor.beforeCreateFunctions || [])
      }
      beforeSaves.push.apply(beforeSaves, that.constructor.beforeSaveFunctions || []) 
    }

    beforeSaves.unshift(function(inst, cb) {
      that.validate(function(inst, errors) {
        //dont pass the errors to the callback, because
        //validate emits it's own invalid event
        if(!errors) {
          cb()
        }
      })
    })

    // Run this after all the beforeSave functions have been called in order
    // to actually save the document, unless any of them have errors
    beforeSaves.push(function() {
      that.performSave(cb)
    })

    _.asyncEach(beforeSaves, function(beforeSave, next) { 
      _(beforeSave).bind(that)(that, function(err) {
        if(!err) {
          next()
        } else {
          process.nextTick(function() {
            that.emit("error", err)
          })
        }
      })
    })
    return this
  }
  
 /**
  * Gets the value of field
  *
  * @api public
  **/

, get: function(field) {
    var dynamic = this.dynamicKeyGetters[field]
    if(dynamic) {
      return dynamic.call(this)
    } else {
      return this.document[field]
    }
  }

, assoc: function(assoc, callback) {
    var callback = callback || function() {}
      , model
    if(this.oneAssociations[assoc]) {
      return this.oneAssociations[assoc](callback)
    } else if(this.belongAssociations[assoc]) {
      return this.belongAssociations[assoc](callback)
    } else if (this.manyAssociations[assoc]) {
      return this.manyAssociations[assoc](callback)
    } else {
      throw new Error("No such association " + assoc)
    }
  }

 /**
  * takes in a hash of keys and values to set, or a string as the first arg
  * and a value(anything serializable) as the second.
  * fires a change event, which happens after all of the changes have been made
  *
  * If you call set from inside of a change event, it won't call another change
  * event, phew!
  **/
  
, set: function(field, value, opts) {
    opts = opts || {}

    if(typeof field === "undefined") {
      throw new Error("Must at least provide a field to set")
    }

    if(typeof field === "object" && typeof value === "object") {
      opts = value
    }

    if(field === "_id" && typeof this.document._id !== "undefined" && this.document._id !== value) {
      throw new Error("Can't change _id after its been set")
    }

    var that = this
      , alreadyChanging = this.alreadyChanging
      , oldValue
      
    this.alreadyChanging = true
    // we're initiating the changes, so we'll store the old values
    if(alreadyChanging == false) {
      this.previousDocument = _.clone(this.document)
    }

    if(typeof field == "object") {
      _.each(field, function(v, k) {
        that.set(k, v, opts)
      })
    } else if(that.manyAssociations[field]) {
      that.manyAssociations[field]().add(value)
    } else {
      if(this.dynamicKeySetters[field]) {
        this.dynamicKeySetters[field].call(this, value)
        return this
      }
      oldValue = this.document[field]
      if(this.document[field] != value) {
        this.document[field] = value
        this.emit("change:" + field, value, oldValue, this)
      }
      if(!opts.initialize) {
        this.unsavedChanges = _.union(this.unsavedChanges, [field])
      }
    }

    // if THIS instance of set started the changes, it should emit the change 
    // event and then end the changingness
    if(alreadyChanging == false) {
      this.triggerChange(opts)
    }
    return this
  }

  /**
   * fires the actual change events for the fields that change, as well as the
   * coarse grained "change" event.
   *
   * also stops the document from changing and sets the previous document to the
   * new document.
   */

, triggerChange: function(opts) {
    var that = this
      , fields = _.union(_.keys(this.document), _.keys(this.previousDocument))
      , changedFields = _.filter(fields, function(key) {
          return that.document[key] != that.previousDocument[key]
        })
      , changedDynamics = []
                        

    // if something actually changed
    if(changedFields.length > 0) {
      this.saved = false
      this.emit("change", this, changedFields)
      _(changedFields).each(function(field) {
        changedDynamics = _(changedDynamics).union(that.dynamicKeyDeps[field] || [])
        if(opts.validate !== false) {
          that.validateField(field)
        }
      })
      _(changedDynamics).each(function(field) {
        that.emit("change:" + field, that, that.get(field))
      })
    }
    this.previousDocument = _.clone(this.document)
    this.alreadyChanging = false 
  }

  /**
   * Removes the document from the database.  This emits a delete event once
   * deleting has finished.
   *
   * Calls after remove methods, there are no before remove functions yet, since
   * I had no reason to implement them, if you're looking for something to do though...
   * 
   * TODO Implement beforeRemove functions
   **/

, remove: function(callback) {
    callback = callback || function() {}
    var that = this
      , db   = this.getDb()
      , callbacks = []
    db.remove(this.get("_id"), function() {
      that.deleted = true
      that.emit("delete", that)
      callback(that)
      if(!that.constructor.isServer) {
        callbacks = callbacks.concat(that.constructor.afterRemoves || [])
      } else {
        callbacks = callbacks.concat(that.constructor.serverAfterRemoves || [])
      }
      _(callbacks).each(function(callback) {
        callback.call(that, that)
      })
    }) 
  }

  /**
   * Validates a single field.  emits a valid event if it is valid and
   * an invalid event if it's invalid.
   **/
, validateField: function(field, callback, opts) {
    opts = opts || {}
    callback = callback || function() {}

    var that = this
    var validations = (this.constructor.validations || {})[field]
    var valid = []
    _.asyncEach(validations, function(value, rule, next) {
      if(rule === "min" && that.get(field) && that.get(field).length < value) {
        valid.push("short")
        next()
      } else if(rule === "isInt" && that.get(field) && (parseFloat(that.get(field)) != parseInt(that.get(field)) || isNaN(that.get(field)))) {
        valid.push("isInt")
        next()
      } else if(rule === "max" && that.get(field) && that.get(field).length >= value) {
        valid.push("long")
        next()
      } else if(rule === "required" && !that.get(field)) {
        valid.push("required")
        next()
      } else if(rule === "unique") {
        that.isUnique(field, that.get(field), function(unique) {
          if(!unique) {
            valid.push("unique")
          }
          next()
        })
      } else {
        next()
      }
    }, function() {
      if(valid.length > 0) {
        if(!opts.silent) {
          that.emit("invalid:" + field, that, valid)
        }
        callback(that, valid)
      } else {
        // emit an event when a field is valid
        // useful for removing error messages
        if(!opts.silent) {
          that.emit("valid:" + field, that)
        }
        callback(that)
      }
    })
  }
  /** 
   * Forces the document to validate based on the values it has set
   * will emit invalid event, if the document is invalid, unless 
   * opts.silent is true.
   *
   * Todo make opts the first param
   **/
, validate: function(cb, opts) {
    cb = cb || function() {}

    opts = opts || {}
    var that = this
    _.asyncMap(this.constructor.validations, function(validations, field, next) {
      that.validateField(field, function(instance, errors) { 
        if(errors) {
          next(field, errors)
        } else {
          next()
        }
      }, opts)
    }, function(valid) {
      if(_.keys(valid).length != 0) {
        cb(that, valid)
        if(!opts.silent) {
          process.nextTick(function() {
            that.emit("invalid", that, valid)
          })
        }
      } else {
        cb(that)
        that.emit("valid", that)
      }     
    })
  }

  /** check if no other documents exist with property,
   * value
   *
   * TODO make this NOT prone to race conditions
   **/
, isUnique: function(property, value, callback) {
    var obj = {_id: {$ne : this.get("_id")}}
    value = value || ""
    obj[property] = value
    this.constructor.find(obj, function(things) {
      callback(things.length === 0)
    })
  }
  /**
   * Called as soon as the document is loaded, if the document is already
   * loaded, call it right away
   */
, load: function(callback) {
    if(this.loaded) {
      process.nextTick(callback)
    } else {
      this.once("load", callback)
    }
  }

, keys: function() {
    var keys = _.clone(this.constructor.keys)
    keys = keys.concat(_.keys(this.constructor.dynamicKeyGetters || {}))
    keys.push("_id")
    keys.push("createdAt")
    keys.push("updatedAt")
    return keys
  }
 
, oneAssocs: function() {
    var assocs = _.union(
      _.keys(this.constructor.hasOne || {}) 
    , _.keys(this.constructor.belongingTo || {})
    , _.keys(this.constructor.polymorphicBelongingTo || {})
    )
    return assocs
  } 
, manyAssocs: function() {
    return _.keys(this.constructor.hasMany || {})
  } 
, assocs: function() {
   return this.oneAssocs().concat(this.manyAssocs())
  }
}
module.exports = InstanceMethods
