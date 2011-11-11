module.exports = LiveDocument = (name, socket) ->
  return {
    read: (query, callback) ->
      if typeof query == "function"
        callback = query
        query = {}

      socket.emit "LiveDocumentRead", name, query, callback

    create: (document, callback) ->
      socket.emit "LiveDocumentCreate", name, document, callback
  }
