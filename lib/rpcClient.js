define(function() {

  return function(socket) {
    return function(hash) {
      return function() {
        socket.emit.apply(socket, ["LiveDocumentMethod" + hash].concat([].slice.call(arguments)))
      }
    }
  }

})
 
