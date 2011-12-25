define () ->
  LiveDocumentAssociations =
    one: (assoc) ->
      @hasOneAssocs ||= []
      @hasOneAssocs.push assoc

  return LiveDocumentAssociations
