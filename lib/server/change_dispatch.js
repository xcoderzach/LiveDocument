var QueryMatcher = require("./query_matcher")
  , _ = require("underscore")
  , crypto = require("crypto")

function ChangeDispatch(idCallback, queryCallback) {
  this.ids = {}
  this.queryListeners = {}
  this.idCallback = idCallback
  this.queryCallback = queryCallback
}
module.exports = ChangeDispatch
 
ChangeDispatch.instances = {}
ChangeDispatch.globalQueryListeners = {}
ChangeDispatch.globalIdListeners = {} 

ChangeDispatch.prototype.watchId = function(id) {
  if(!ChangeDispatch.globalIdListeners[id]) {
    ChangeDispatch.globalIdListeners[id] = []
  }
  if(!this.ids[id]) {
    this.ids[id] = true
    ChangeDispatch.globalIdListeners[id].push(this)
  }
}

ChangeDispatch.prototype.unwatchId = function(id) {
  if(ChangeDispatch.globalIdListeners[id]) {
    var index = _(ChangeDispatch.globalIdListeners[id]).indexOf(this)
    if(index !== -1) {
      ChangeDispatch.globalIdListeners[id].splice(index, 1)
    }
    if(ChangeDispatch.globalIdListeners[id].length === 0) {
      delete ChangeDispatch.globalIdListeners[id]
    }
    delete this.ids[id]
  }
}

ChangeDispatch.prototype.unwatchAllIds = function() {
  var that = this
  _(this.ids).each(function(x, id) {
    that.unwatchId(id)
  })
  
}

ChangeDispatch.prototype.idChanged = function(id) {
  this.idCallback(id)
}

ChangeDispatch.notifyIdChange = function(id) {
  var args = arguments
  _(ChangeDispatch.globalIdListeners[id]).each(function(listener) {
    listener.idCallback.apply(null, args)
  })
}


function hashQuery(query) {
  var hash = crypto.createHash("md5")
    , keys = _.keys(query)
    keys = _(keys).sortBy(function(key) {
      return key
    })
    _(keys).each(function(key) {
      hash.update(key)
      if(typeof query[key] === "object" && query[key]) { 
        hash.update(hashQuery(query[key]))
      } else {
        hash.update(query[key].toString())
      }
    })
  return hash.digest('hex') 
}

ChangeDispatch.prototype.watchQuery = function(query, id, collection) {
  var globalListeners = ChangeDispatch.globalQueryListeners[collection] = ChangeDispatch.globalQueryListeners[collection] || {}
    , queryHash = hashQuery(query)
  globalListeners[queryHash] = globalListeners[queryHash] || { query: query, listeners: {} }
  globalListeners[queryHash].listeners[id] = this

  this.queryListeners[collection] = this.queryListeners[collection] || {}
  this.queryListeners[collection][id] = queryHash
}

ChangeDispatch.prototype.unwatchQuery = function(collection, id) {
  var queryHash = this.queryListeners[collection][id]
  delete this.queryListeners[collection][id]
  delete ChangeDispatch.globalQueryListeners[collection][queryHash].listeners[id]
  if(_.keys(ChangeDispatch.globalQueryListeners[collection][queryHash].listeners).length === 0) {
    delete ChangeDispatch.globalQueryListeners[collection][queryHash]
  }
}

ChangeDispatch.prototype.unwatchAllQueries = function() {
  var that = this
  _(this.queryListeners).each(function(ids, collection) {
    _(ids).each(function(index, id) {
      that.unwatchQuery(collection, id)
    })
  })
} 
 
ChangeDispatch.notifyQueryChange = function(document, operation, collection) {
  var queries = ChangeDispatch.globalQueryListeners[collection]

  _(queries).each(function(obj) {
    var query     = obj.query
      , listeners = obj.listeners
    _(listeners).each(function(instance, queryId) {
      if(QueryMatcher.match(document, query)) {
        instance.queryCallback(document, queryId, operation)
      }
    })
  })
}
ChangeDispatch.notifyQueryDiff = function(oldDoc, newDoc, collection) {
  _(ChangeDispatch.globalQueryListeners[collection] || []).filter(function(listener) {
    var query = listener.query
      , instance = listener.listener 
      , queryId = listener.queryId

    if(QueryMatcher.match(oldDoc, query) && !QueryMatcher.match(newDoc, query)) {
      instance.queryCallback(newDoc, queryId, "remove")
    } else if (!QueryMatcher.match(oldDoc, query) && QueryMatcher.match(newDoc, query)) {
      instance.queryCallback(newDoc, queryId, "insert")
    }
  })
}
