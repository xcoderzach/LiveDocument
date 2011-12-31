if (typeof define !== 'function') {var define = (require('amdefine'))(module);}   
define(function() {
  return function(socket) {
    return function(hash) {
      return function() {
        socket.emit.apply(socket, [ "LiveDocumentMethod" + hash, this.get("_id") ]
                         .concat([].slice.call(arguments)))
      }
    }
  }
})
 
