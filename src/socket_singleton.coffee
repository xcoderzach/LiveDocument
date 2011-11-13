socket = null
module.exports.getSocket = () ->
  if(!socket?)
    socket = {}
  return socket


module.exports.setSocket = (s) ->
  socket = s
