matchers =
  $e: (document, field, value) ->
    return document[field] == value

  $ne: (document, field, value) ->
    return document[field] != value

  $gt: (document, field, value) ->
    return document[field] > value

  $gte: (document, field, value) ->
    return document[field] >= value

  $lt: (document, field, value) ->
    return document[field] < value

  $lte: (document, field, value) ->
    return document[field] <= value

  $all: () -> throw "implement me!"
  $exists: () -> throw "implement me!"
  $mod: () -> throw "implement me!"
  $ne: () -> throw "implement me!"
  $ni: () -> throw "implement me!"
  $nin: () -> throw "implement me!"
  $nor: () -> throw "implement me!"
  $or: () -> throw "implement me!"
  $and: () -> throw "implement me!"
  $size: () -> throw "implement me!"
  $type: () -> throw "implement me!"
  $elemMatch: () -> throw "implement me!"
  $not: () -> throw "implement me!"
  $where: () -> throw "implement me!"
  
# dot notation
define () ->

  ConditionMatcher =
    match: (document, conditions) ->
      matched = true
      Object.keys(conditions).forEach (field) ->
        condition = conditions[field]
        if typeof condition != "object"
          matched = matched && matchers.$e document, field, condition
        else
          Object.keys(condition).forEach (operator) ->
            value = condition[operator]
            matched = matched && matchers[operator] document, field, value
      return matched

  return ConditionMatcher
