 /**
  * matchers take the form of (actual, expected)
  *
  * actual is the actual value, and expected is 
  * the value from the query
  *
  * a good way to think about it is actual <FUNCTION> expected
  * for example actual $gt expected, actual is greater than 
  * expected 
  */

var matchers = {
  $e: function(actual, expected) {
    return actual == expected
  }
, $ne: function(actual, expected) {
    return actual != expected
  }
, $gt: function(actual, expected) {
    return actual > expected
  }
, $gte: function(actual, expected) {
    return actual >= expected
  }
, $lt: function(actual, expected) {
    return actual < expected
  }
, $lte: function(actual, expected) {
    return actual <= expected }
, $all: function() { throw "implement me!" }
, $regex: function(actual, expected) { 
    if(!(actual instanceof RegExp)) {
      actual = new RegExp(actual)
    }
    return !!expected.match(actual)
  }
, $exists: function() { throw "implement me!" }
, $mod: function() { throw "implement me!" }
, $ne: function() { throw "implement me!" }
, $ni: function() { throw "implement me!" }
, $nin: function() { throw "implement me!" }
, $nor: function() { throw "implement me!" }
, $or: function() { throw "implement me!" }
, $and: function() { throw "implement me!" }
, $size: function() { throw "implement me!" }
, $type: function() { throw "implement me!" }
, $elemMatch: function() { throw "implement me!" }
, $not: function() { throw "implement me!" }
, $where: function() { throw "implement me!" }
}
  
var ConditionMatcher = module.exports = {
  match: function(document, conditions) {
    var matched = true
      , condition
      , value
    Object.keys(conditions).forEach(function(field) {
      condition = conditions[field]
      if(typeof condition != "object") {
        matched = matched && matchers.$e(document[field], condition)
      } else {
        Object.keys(condition).forEach(function(operator) {
          value = condition[operator]
          matched = matched && matchers[operator](document[field], value)
        })
      }
    })
    return matched
  }
}
