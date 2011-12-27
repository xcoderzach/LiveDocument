define () ->
  return (db)->
    return {
      create: (document, callback) ->
        db.insert document, (err, doc) ->
          callback doc
     
      read: (conditions, callback) ->
        db.find(conditions).toArray (err, arr) ->
          callback arr

      update: (conditions, document, callback) ->
        db.findAndModify { query: conditions, update: document}, (err, doc) ->
          callback doc

      delete: (conditions, callback) ->
        db.findAndModify { query: conditions, remove: true }, (err, doc) ->
          callback doc
    }
