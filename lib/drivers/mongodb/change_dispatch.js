_ = require("underscore")

function ChangeDispatch(idCallback) {
  this.ids = {}
  this.listeners = {}
  this.idCallback = idCallback
  this.dispatchNumber = ChangeDispatch.nonceDispachNumber++
  ChangeDispatch.instances[this.dispatchNumber] = this
}
module.exports = ChangeDispatch
 
ChangeDispatch.instances = {}
ChangeDispatch.nonceDispachNumber = 0
ChangeDispatch.globalQueryListeners = []
ChangeDispatch.globalIdListeners = {} 

ChangeDispatch.prototype.watchId = function(id) {
  if(!ChangeDispatch.globalIdListeners[id]) {
    ChangeDispatch.globalIdListeners[id] = []
  }
  if(!this.ids[id]) {
    this.ids[id] = true
    ChangeDispatch.globalIdListeners[id].push(this.dispatchNumber)
  }
}

ChangeDispatch.prototype.unwatchId = function(id) {
  var index = _(ChangeDispatch.globalIdListeners[id]).indexOf(this.dispatchNumber)
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
    ChangeDispatch.instances[listener].idCallback.apply(null, args)
  })
}
