{ EventEmitter } = require("events")
LiveDocument = require("./src/live_document")

newMocket = () ->
  new EventEmitter()

socket = newMocket()
LiveDocument.socket = socket
