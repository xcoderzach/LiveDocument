Inflector = require "../lib/inflection"
_ = require "../lib/underscore.js"

module.exports = (socket) ->

  machineId = Math.ceil(Math.random()*10000000).toString().slice(0, 6)
  pid = Math.ceil(Math.random()*10000000).toString().slice(0, 4)
  increment = 0

  generateObjectId = () ->
    t = Math.floor((new Date).getTime() / 1000).toString(16)
    m = machineId
    p = pid 
    i = increment.toString(16)

    if(increment > 0xffffff)
      increment = 0 
    else
      increment++

    return '00000000'.substr(0, 8 - t.length) + t + 
           '000000'.substr(0, 6 - m.length) + m + 
           '0000'.substr(0, 4 - p.length) + p + 
           '000000'.substr(0, 6 - i.length) + i

  class LiveDocument

    constructor: (@document) ->
      if !@document._id 
        @document._id = generateObjectId()
      @buildAssocs()

    get: (field) ->
      @document[field]

    buildAssocs: () ->
      _.each @constructor.hasOneAssocs, (assoc) =>
        query = {}
        query[@constructor.name + "_id"] = @_id
        @[assoc] =
          watch: (callback) =>
            @constructor.sendReadMessage Inflector.pluralize(assoc), query, (docs) ->
              callback docs[0]   
          create: (document, callback) =>
            document[assoc + "_id"] = @_id
            @constructor.sendCreateMessage Inflector.pluralize(assoc), document, (doc) ->
              callback doc  
          update: (callback) =>
            @constructor.sendUpdateMessage Inflector.pluralize(assoc), query, document, (doc) ->
              callback doc   

    @createDocumentInstance: (document) ->
      if Array.isArray(document)
        _.map document, (doc) =>
          new @(doc)
      else
        new @constructor.create(doc)

    @sendReadMessage: (name, query, callback) ->
      socket.emit "LiveDocumentRead", name, query, callback

    @sendCreateMessage: (name, document, callback) ->
      socket.emit "LiveDocumentCreate", name, document, callback

    @sendUpdateMessage: (name, query, document, callback) ->
      socket.emit "LiveDocumentUpdate", name, query, document, callback

    @read: (query, callback) ->
      if typeof query == "function"
        callback = query
        query = {}

      @sendReadMessage Inflector.pluralize(Inflector.uncapitalize(@name)), query, (documents) =>
        callback @createDocumentInstance(documents)

    @create: (document, callback) ->
      if(!callback?)
        callback = () ->

      instance = new @(document) 
      socket.emit "LiveDocumentCreate", Inflector.pluralize(Inflector.uncapitalize(@name)), document, callback
      return instance 

    @one: (assoc) ->
      @hasOneAssocs ||= []
      @hasOneAssocs.push assoc
      
  return LiveDocument
