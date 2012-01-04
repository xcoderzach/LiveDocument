var generateObjectId = require("./object_id")
  , _ =                require("underscore") 

  , LiveDocumentInstanceMethods = module.exports = {
  constructor: function(document) {
    var that = this

    this.document = document || {}
    this.deleted = false
    this.saved = false
    this.persisted = false
    this.loaded = false
    this.alreadyChanging = false

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
      , beforeSave
    if(this.get('title').length < this.constructor.min || this.get('title').length > this.constructor.max){
      process.nextTick(function() {
        that.emit("error", this, {"title": ["too short"]})
      })
      return
    }
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
    if(that.constructor.beforeSaveFunctions) {
      callNext = function(i) {
        if(i < that.constructor.beforeSaveFunctions.length) {
          beforeSave = _(that.constructor.beforeSaveFunctions[i]).bind(that)
          beforeSave(function(err) {
            if(!err) {
              callNext(i+1)
            } else {
              that.emit("error", err)
            }
          }, that)
        } else {
          afterAfterSave()
        }
      }
      callNext(0)
    } else {
      afterAfterSave()
    }
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
}
