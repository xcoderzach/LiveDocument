requestNumber = 0
module.exports = LiveDocument = (name, socket) ->
  return {
    read: (query, callback) ->
      if typeof query == "function"
        callback = query
        query = {}

      currentRequestNumber = requestNumber++


      socket.emit "LiveDocumentRead", name, query, callback

    create: (document, callback) ->

      currentRequestNumber = requestNumber++

      socket.emit "LiveDocumentCreate", name, document, callback
  }
