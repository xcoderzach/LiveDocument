if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( [ "underscore", "events" ]
      , function(_, events) {

  var EventEmitter = events.EventEmitter

  function LiveDocumentCollection(query, LiveDocumentClass) {
    _.extend(this, new EventEmitter)

    this.LiveDocumentClass = LiveDocumentClass
    this.items = []
    this.changeListeners = {}
    this.loaded = false
    this.ids = {}
    this.length = this.items.length
    this.orderBy = false
  }

  // returns the item at position _index_ in the collection
  LiveDocumentCollection.prototype.at = function (index) {
    return this.ids[this.items[index]]
  }

  // returns the item with _id_ in the collection
  LiveDocumentCollection.prototype.get = function(id) {
    return this.ids[id]
  }

  // Set the _field_ name by which to sort your collection
  LiveDocumentCollection.prototype.sortBy = function(field) {
    this.orderBy = field
    return this
  }
  /**
   * Returns the index at which to insert item with id _id_
   * it no sorting is specified, just append it to the bottom
   * you probably dont need to use this
   **/
  LiveDocumentCollection.prototype.insertAt = function(id) {
    var that = this
    if(this.orderBy) {
      return _.sortedIndex(this.items, id, function(idToCheck) {
        return that.get(idToCheck).get(that.orderBy)
      })
    } else {
      return this.items.length
    }
  }

  LiveDocumentCollection.prototype.documentChange = function(document, changedFields) {
    if(this.orderBy && _(changedFields).indexOf(this.orderBy) >= 0) {
      var oldIndex = _(this.items).indexOf(document.get("_id"))
        , newIndex = this.insertAt(document.get("_id"))
      // if the place where we WOULD insert it, if we were to reinsert it
      // is not 0 (right before itself) or 1 (right after itself)
      if(0 >= (oldIndex - newIndex) <= 1) {
        this.handleRemove(document)
        this.handleInsert(document)
      }
    }
  }

  LiveDocumentCollection.prototype.handleLoad = function(documents) {
    var that = this
    _.each(documents, function(doc) {
      that.handleInsert(doc, false)
    })
    this.loaded = true
    this.emit("load", this)
  }

  LiveDocumentCollection.prototype.handleInsert = function(document, emit) {
    var id
      , changeListener = this.documentChange.bind(this)
    if(typeof emit === "undefined") {
      emit = true
    }
    if(document instanceof this.LiveDocumentClass) {
      id = document.get("_id")
    } else {
      id = document._id
      document = new this.LiveDocumentClass(document, {validate: false})
    }
    document.loaded = true
    document.persisted = true
    document.on("change", changeListener)
    this.ids[id] = document
    this.changeListeners[id] = changeListener
    this.items.splice(this.insertAt(id), 0, id)
    this.length = this.items.length
    if(emit) {
      this.emit("insert", document, this)
    }
  }

  LiveDocumentCollection.prototype.handleRemove = function(document) {
    var oldDoc
      , id
      , index
    if(document instanceof this.LiveDocumentClass) {
      id = document.get("_id")
    } else {
      id = document._id
    }
    index = _(this.items).indexOf(id)
    if(index >= 0) {
      oldDoc = this.ids[id]
      this.items.splice(index, 1)
      this.length = this.items.length
      oldDoc.removeListener("change", this.changeListeners[id])
      delete this.changeListeners[id]
      delete this.ids[id]
      this.emit("remove", oldDoc, this)
    }
  }

 /**
  * Called when a notification is pushed from the server.
  * If the document has been added to the collection, 
  * insert it, if its removed, remove it, and if it's the
  * initial loading then insert all of those documents
  *
  * @param document being added, an array of documents on load
  * @param method type of event, load, insert or remove
  *
  * @api private
  **/
  
  LiveDocumentCollection.prototype.handleNotification = function(document, method) {
    if(method === "load") {
      this.handleLoad(document)
    } else if(method === "insert") {
      this.handleInsert(document)
    } else if(method === "remove") {
      this.handleRemove(document)
    }
  }

  return LiveDocumentCollection

})
