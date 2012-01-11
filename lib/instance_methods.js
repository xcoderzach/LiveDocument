if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["require", "./object_id", "underscore"]
      , function(require, generateObjectId, _) { 

  _.mixin({ 
    asyncEach: function(coll, fn, end) {
      var type
        , obj
        , end = end || function() {}
      if(typeof coll === "object" && !_.isArray(coll)) {
        obj = coll
        coll = _.keys(coll)
        type = "object"
      }
      var callNext = function(i) {
        if(i < coll.length) {
          if(type == "object") {
            fn(obj[coll[i]], coll[i], function() {
              callNext(i+1)
            })
          } else {
            fn(coll[i], function() {
              callNext(i+1)
            })
          }
        } else {
          end()
        }
      }
      if(coll && coll.length) {
        callNext(0) 
      } else {
        end()
      }
    }
  })


  var LiveDocumentInstanceMethods = {
    constructor: function(document) {
      var that = this

      this.document = document || {}
      this.deleted = false
      this.saved = false
      this.persisted = false
      this.loaded = false
      this.alreadyChanging = false

      //Don't break if no error handlers are set
      this.on("error", function() {})

      this.modelName = this.constructor.modelName
      if (this.modelName == undefined)
      this.collectionName = _.pluralize(_.uncapitalize(this.modelName))

      if(!this.document._id) {
        this.document._id = generateObjectId()
      }

      this.constructor.socket.on("LiveDocumentUpdate" + this.get("_id"), function(doc) {
        that.set(doc)
      })
      this.constructor.socket.on("LiveDocumentDelete" + this.get("_id"), function(doc) {
        that.deleted = true
        that.set(doc)
        that.emit("delete", that)
      })
    }
   /**
    * Save will create the document if it has not yet been persisted to the
    * database, otherwise it will update the version in the database, calls
    * the callback with itself, returns itself for chaining
    **/
  , save: function(cb) {
      cb = cb || function() {}
      var that = this
        , doc
        , callNext
        , beforeSaves
        , beforeSave
      var afterAfterSave = function() {
        that.emit("saving", that)
        if(that.persisted == false) {
          that.constructor.sendCreateMessage(that.document, function() {
            that.saved = true
            that.emit("saved", that)
            cb(that)
            that.persisted = true
          })
        } else {
          // TODO only send changed fields
          doc = _.clone(that.document)
          delete doc._id
          that.constructor.sendUpdateMessage({ _id: that.get("_id") }, doc, function() {
            that.saved = true
            cb(that)
            that.emit("saved", that)
          })
        }
      }              

      beforeSaves = (that.constructor.beforeSaveFunctions || []).slice(0)
      beforeSaves.unshift(function(inst, cb) {
          that.validate(function(inst, err) {
            cb(err)
          }, {silent: true})
      })
      beforeSaves.push(_(afterAfterSave).bind(that))

      _.asyncEach(beforeSaves, function(beforeSave, next) { 
        _(beforeSave).bind(that)(that, function(err) {
          if(!err) {
            next()
          } else {
            process.nextTick(function() {
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
      return this.document[field]
    }
    
   /**
    * takes in a hash of keys and values to set, or a string as the first arg
    * and a value(anything serializable) as the second.
    * fires a change event, which happens after all of the changes have been made
    *
    * If you call set from inside of a change event, it won't call another change
    * event, phew!
    **/
    
  , set: function(field, value) {
      var that = this
        , alreadyChanging = this.alreadyChanging
        , oldValue
        , fields
        , changedFields
        
      this.alreadyChanging = true
      // we're initiating the changes, so we'll store the old values
      if(alreadyChanging == false) {
        this.previousDocument = _.clone(this.document)
      }

      if(typeof field == "object") {
        _.each(field, function(v, k) {
          that.set(k, v)
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
        fields = _.union(_.keys(this.document), _.keys(this.previousDocument))

        changedFields = _.filter(fields, function(key) {
          return that.document[key] != that.previousDocument[key]
        })
                            
        // if something actually changed
        if(changedFields.length > 0) {
          this.saved = false
          this.emit("change", this, changedFields)
        }
        this.previousDocument = _.clone(this.document)
        this.alreadyChanging = false
      }
      return this
    }

  , validate: function(cb, opts) {
      cb = cb || function() {}
      opts = opts || {}
      var that = this
        , valid = {}

      _.asyncEach(this.constructor.validations, function(validations, field, outerNext) {
        _.asyncEach(validations, function(value, rule, next) {
          if(rule === "min" && that.get(field).length < value) {
            valid[field] = valid[field] || []
            valid[field].push("short")
            next()
          } else if(rule === "max" && that.get(field) && that.get(field).length > value) {
            valid[field] = valid[field] || []
            valid[field].push("long")
            next()
          } else if(rule === "required" && !that.get(field)) {
            valid[field] = valid[field] || []
            valid[field].push("required")
            next()
          } else if(rule === "unique") {
            that.isUnique(field, that.get(field), function(unique) {
              if(!unique) {
                valid[field] = valid[field] || []
                valid[field].push("unique")
              }
              next()
            })
          } else {
            next()
          }
        }, outerNext)
      }, function() {
        if(_.keys(valid).length != 0) {
          cb(that, valid)
          if(!opts.silent) {
            process.nextTick(function() {
              that.emit("error", that, valid)
            })
          }
        } else {
          cb(that)
        }     
      })
    }

  , isUnique: function(property, value, done) {
      var obj = {}
      value = value || ""
      obj[property] = value
      this.constructor.read(obj, function(things) {
        done(things.length === 0)
      })
    }
  
}
  return LiveDocumentInstanceMethods
})
