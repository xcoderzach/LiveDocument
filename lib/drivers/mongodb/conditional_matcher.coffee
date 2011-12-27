# matchers take the form of (actual, expected)
#
# actual is the actual value, and expected is 
# the value from the query
#
# a good way to think about it is actual <FUNCTION> expected
# for example actual $gt expected, actual is greater than 
# expected 

matchers =
  $e: (actual, expected) ->
    return actual == expected

  $ne: (actual, expected) ->
    return actual != expected

  $gt: (actual, expected) ->
    return actual > expected

  $gte: (actual, expected) ->
    return actual >= expected

  $lt: (actual, expected) ->
    return actual < expected

  $lte: (actual, expected) ->
    return actual <= expected
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

define ->
  ConditionMatcher =
    match: (document, conditions) ->
      matched = true
      Object.keys(conditions).forEach (field) ->
        condition = conditions[field]
        if typeof condition != "object"
          matched = matched && matchers.$e(document[field], condition)
        else
          Object.keys(condition).forEach (operator) ->
            value = condition[operator]
            matched = matched && matchers[operator](document[field], value)
      return matched
