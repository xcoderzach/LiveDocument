if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["require", "./object_id", "underscore", "./embedded_collection", "./utils"]
      , function(require, generateObjectId, _, EmbeddedLiveDocumentCollection) { 

  var LiveDocumentInstanceMethods = {

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

      this.document = document || {}

      this.deleted = false
      this.saved = false
      this.saving = false
      this.persisted = false
      this.loaded = false
      this.alreadyChanging = false

      this.modelName = this.constructor.modelName

      this.manyAssociations = {}

      _(this.constructor.hasMany).each(function(Model, collectionName) {
        var docs = that.document[collectionName] || []
        delete that.document[collectionName]
        that.manyAssociations[collectionName] = new EmbeddedLiveDocumentCollection(docs, that, Model, that.constructor.socket)
      })

      this.collectionName = this.constructor.collectionName()

      if(!this.document._id) {
        this.document._id = generateObjectId()
      }

      this.constructor.listenForChanges(this.get("_id"), this)
    }             

   /*
    * listen for changes to documents with this id
    * since it's coming from the server we'll assume
    * it validates 
    */
  , handleChange: function(changes) {
      this.set(changes, {validate: false})
    }

   /*
    * listens for this document having been deleted, if it has
    * emit the delete event and set the deleted attribute to false
    */
  , handleRemove: function() {
      this.deleted = true
      this.emit("delete", this)
    }  
     
  , sendUpdate: function(query, document, callback) {
      this.constructor.sendUpdateMessage(query, document, callback)
    }

  , sendCreate: function(document, callback) {
      this.constructor.sendCreateMessage(document, callback)
    }

  , performSave: function(cb) {
      var that = this
        , doc
      this.emit("saving", that)
      this.saving = true
      //if the document has not been already persisted to the database before
      //then its a create event
      if(!this.persisted) {
        this.set("createdAt", (new Date()).getTime())
        this.sendCreate(this.document, function() {
          that.saving = false
          that.saved = true
          that.persisted = true
          that.emit("saved", that)
          cb(that)
        })
      } else {
        // TODO only send changed fields
        doc = _.clone(this.document)
        delete doc._id
        this.set("updatedAt", (new Date()).getTime())
        this.sendUpdate({ _id: that.get("_id") }, doc, function(doc) {
          that.saved = true
          that.saving = false
          that.set(doc)
          cb(that)
          that.emit("saved", that)
        })
      }
    }
     
   /** 
    * Save will create the document on the server if it has not yet been
    * persisted to the database, otherwise it will update the version in the
    * database, calls the callback with itself, returns itself for chaining
    */

  , save: function(cb) {
      cb = cb || function() {}
      var that = this
        , doc
        , callNext
        , beforeSaves
        , beforeSave

      beforeSaves = (that.constructor.beforeSaveFunctions || []).slice(0)
      if(that.constructor.isServer) {
        beforeSaves.push.apply(beforeSaves, that.constructor.serverBeforeSaveFunctions || [])
        //it's a create save
        if(!that.persisted) {
          beforeSaves.push.apply(beforeSaves, that.constructor.serverBeforeCreateFunctions || [])
        }
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

      //this needs to be some middleware
      if(that.constructor.isServer && that.persisted) {
        //it's an update save, put authorizing first in the stack
        beforeSaves.unshift(that.authorizeEdit.bind(that))
      }

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
              console.log(err)
              that.emit("error", that, err)
            })
          }
        })
      })
      return this
    }
    
   /**
    * Gets the value of field, takes in an optional function as second
    * parameter, which will get called once the field is available, and every
    * time the field is changed. Great for binding
    *
    * If the callback has arity one, it passes the value, otherwise it passes
    * (key, value)
    **/
    
  , get: function(field) {
      return this.manyAssociations[field] || this.document[field]
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

      var that = this
        , alreadyChanging = this.alreadyChanging
        , oldValue
        
      this.alreadyChanging = true
      // we're initiating the changes, so we'll store the old values
      if(alreadyChanging == false) {
        this.previousDocument = _.clone(this.document)
      }

      if(typeof field == "object") {
        opts = value || {}
        _.each(field, function(v, k) {
          that.set(k, v)
        })
      } else if(that.manyAssociations[field]) {
        _.each(value, function(doc) {
          that.manyAssociations[field].add(doc)
        })
      } else {
        oldValue = this.document[field]
        if(this.document[field] != value) {
          this.document[field] = value
          this.emit("change:" + field, value, oldValue, this)
        }
      }

      // if THIS instance of set started the changes, it should emit the change 
      // event and then end the changingness
      if(alreadyChanging == false) {
        this.triggerChange(opts)
      }
      return this
    }

  , triggerChange: function(opts) {
      var that = this
        , fields = _.union(_.keys(this.document), _.keys(this.previousDocument))
        , changedFields = _.filter(fields, function(key) {
            return that.document[key] != that.previousDocument[key]
          })
                          
      // if something actually changed
      if(changedFields.length > 0) {
        this.saved = false
        this.emit("change", this, changedFields)
        _(changedFields).each(function(field) {
          if(opts.validate !== false) {
            that.validateField(field)
          }
        })
      }
      this.previousDocument = _.clone(this.document)
      this.alreadyChanging = false 
    }

  , remove: function(callback) {
      this.constructor.delete({ _id: this.get("_id") }, function() {
        callback(this)
      })
    }

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
        } else if(rule === "max" && that.get(field) && that.get(field).length > value) {
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
        }     
      })
    }

  , isUnique: function(property, value, done) {
      var obj = {_id: {$ne : this.get("_id")}}
      value = value || ""
      obj[property] = value
      this.constructor.read(obj, function(things) {
        done(things.length === 0)
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

  , authorizeEdit: function(instance, done) {
      var that = this
        , authorized = true
      _(this.constructor.editUsers).each(function(associatedUser) {
        if(associatedUser === "self" && 
          that.get("_id") !== that.constructor.currentUserId) {
          authorized = false
        }
      })
      if(authorized) {
        done()
      } else {
        done("Not authorized")
      }
    }
  }
  return LiveDocumentInstanceMethods
})
