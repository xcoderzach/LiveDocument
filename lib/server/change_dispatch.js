var QueryMatcher = require("./query_matcher")
  , _ = require("underscore")

function ChangeDispatch(idCallback, queryCallback) {
  this.ids = {}
  this.queryListeners = {}
  this.idCallback = idCallback
  this.queryCallback = queryCallback
}
module.exports = ChangeDispatch
 
ChangeDispatch.instances = {}
ChangeDispatch.globalQueryListeners = []
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
  var index = _(ChangeDispatch.globalIdListeners[id]).indexOf(this)
  if(index !== -1) {
    ChangeDispatch.globalIdListeners[id].splice(index, 1)
  }
  if(ChangeDispatch.globalIdListeners[id].length === 0) {
    delete ChangeDispatch.globalIdListeners[id]
  }
  delete this.ids[id]
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

ChangeDispatch.prototype.watchQuery = function(query, id) {
  var index = ChangeDispatch.globalQueryListeners.push({ listener: this
                                                       , query: query
                                                       , queryId: id})
  this.queryListeners[id] = index - 1
}

ChangeDispatch.prototype.unwatchQuery = function(id) {
  var index = this.queryListeners[id]
  delete this.queryListeners[id]
  delete ChangeDispatch.globalQueryListeners[index]
}

ChangeDispatch.prototype.unwatchAllQueries = function() {
  var that = this
  _(this.queryListeners).each(function(index, id) {
    that.unwatchQuery(id)
  })
} 
 
ChangeDispatch.notifyQueryChange = function(document, operation) {
  _(ChangeDispatch.globalQueryListeners).each(function(listener) {
    var query    = listener.query
      , instance = listener.listener 
      , queryId  = listener.queryId

    if(QueryMatcher.match(document, query)) {
      instance.queryCallback(document, queryId, operation)
    }
  })
}

ChangeDispatch.notifyQueryDiff = function(oldDoc, newDoc) {
  _(ChangeDispatch.globalQueryListeners).filter(function(listener) {
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
