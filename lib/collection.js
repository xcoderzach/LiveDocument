var _ = require("underscore")
  , events = require("events") 

var EventEmitter = events.EventEmitter

function Collection(Model) {
  _.extend(this, new EventEmitter)

  this.Model = Model
  this.collectionName = Model.collectionName()
  this.documents = []
  this.changeListeners = {}
  this.loaded = false
  this.ids = {}
  this.length = this.documents.length
  this.orderBy = false
  this.modelType = "collection"
}

module.exports = Collection

// returns the item at position _index_ in the collection
Collection.prototype.at = function (index) {
  return this.ids[this.documents[index]]
}

Collection.prototype.setRequestId = function (id) {
  this.requestId = id
}

Collection.prototype.stopListening = function () {
  this.Model.socket.emit("StopListeningQuery", this.requestId)
}

// returns the item with _id_ in the collection
Collection.prototype.get = function(id) {
  return this.ids[id]
}

// Set the _field_ name by which to sort your collection
Collection.prototype.sortBy = function(field) {
  this.orderBy = field
  return this
}

// Set the _field_ name by which to sort your collection
Collection.prototype.filter = function(fn) {
  this.filterFn = fn
  return this
}
 

Collection.prototype.load = function(callback) {
  if(this.loaded) {
    process.nextTick(callback)
  } else {
    this.once("load", callback)
  }
}
/**
 * Returns the index at which to insert item with id _id_
 * if no sorting is specified, just append it to the bottom
 * you probably dont need to use this
 **/
Collection.prototype.insertAt = function(id) {
  var that = this
  if(this.orderBy) {
    return _.sortedIndex(this.documents, id, function(idToCheck) {
      return that.get(idToCheck).get(that.orderBy)
    })
  } else {
    return this.documents.length
  }
}

Collection.prototype.each = function(iterator, context) {
  _(this.documents).each(function(id) {
    iterator.call(context, this.get(id))
  }, this)
}

Collection.prototype.documentChange = function(document, changedFields) {
  if(this.orderBy && _(changedFields).indexOf(this.orderBy) >= 0) {
    var oldIndex = _(this.documents).indexOf(document.get("_id"))
      , newIndex = this.insertAt(document.get("_id"))
    // if the place where we WOULD insert it, if we were to reinsert it
    // is not 0 (right before itself) or 1 (right after itself)
    if(0 >= (oldIndex - newIndex) <= 1) {
      this.doRemove(document)
      this.doInsert(document)
    }
  }
}

Collection.prototype.handleLoad = function(documents) {
  var that = this
  _.each(documents, function(doc) {
    that.handleInsert(doc, true)
  })
  this.loaded = true
  this.emit("load", this)
}

Collection.prototype.handleInsert = function(document, emit, persisted) {
  var id
    , changeListener = this.documentChange.bind(this)
    , that = this
  if(typeof emit === "undefined") {
    emit = true
  }
  if(typeof persisted === "undefined") {
    persisted = true
  }

  if(this.parentDocument) {
    document = new this.Model(this.parentDocument, document, {validate: false})
  } else {
    document = new this.Model(document, {validate: false})
  }
  id = document.get("_id")
  this.ids[id] = document

  this.doInsert(document, emit)
   
  document.loaded = true
  document.persisted = persisted
  document.on("change", changeListener)
  this.changeListeners[id] = changeListener
  document.once("delete", function() {
    that.handleRemove(document.document)
  })
  return document
}

Collection.prototype.doInsert = function(document, emit) {
  var id = document.get("_id")
  this.documents.splice(this.insertAt(id), 0, id)
  this.length = this.documents.length
  if(emit) {
    this.emit("insert", document, this)
  } 
}

Collection.prototype.handleRemove = function(document) {
  var oldDoc
    , id = document._id 

  if(this.ids[id]) {
    oldDoc = this.ids[id]
    this.doRemove(oldDoc)
    oldDoc.removeListener("change", this.changeListeners[id])
    delete this.changeListeners[id]
    delete this.ids[id]
    this.emit("remove", document, this)
  }
}

Collection.prototype.doRemove = function(document) {
  var index = _(this.documents).indexOf(document.get("_id"))
  if(index !== -1) {
    this.documents.splice(index, 1)
  }
  this.length = this.documents.length
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

Collection.prototype.handleNotification = function(document, method) {
  //this document is already 
  //a part of our collection
  if(this.ids[document._id] && method !== "remove") {
    return
  }

  if(method === "load") {
    return this.handleLoad(document)
  } else if(method === "insert") {
    return this.handleInsert(document)
  } else if(method === "remove") {
    return this.handleRemove(document)
  }
}
