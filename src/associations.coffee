module.exports = LiveDocumentAssociations = 
  one: (assoc) ->
    @hasOneAssocs ||= []
    @hasOneAssocs.push assoc
