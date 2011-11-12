uncountableWords = [ 'equipment', 'information', 'rice', 'money', 'species', 
                       'series', 'fish', 'sheep', 'moose', 'deer', 'news' ]

pluralRules = [
    [new RegExp('(m)an$', 'gi'),                 '$1en'],
    [new RegExp('(pe)rson$', 'gi'),              '$1ople'],
    [new RegExp('(child)$', 'gi'),               '$1ren'],
    [new RegExp('^(ox)$', 'gi'),                 '$1en'],
    [new RegExp('(ax|test)is$', 'gi'),           '$1es'],
    [new RegExp('(octop|vir)us$', 'gi'),         '$1i'],
    [new RegExp('(alias|status)$', 'gi'),        '$1es'],
    [new RegExp('(bu)s$', 'gi'),                 '$1ses'],
    [new RegExp('(buffal|tomat|potat)o$', 'gi'), '$1oes'],
    [new RegExp('([ti])um$', 'gi'),              '$1a'],
    [new RegExp('sis$', 'gi'),                   'ses'],
    [new RegExp('(?:([^f])fe|([lr])f)$', 'gi'),  '$1$2ves'],
    [new RegExp('(hive)$', 'gi'),                '$1s'],
    [new RegExp('([^aeiouy]|qu)y$', 'gi'),       '$1ies'],
    [new RegExp('(x|ch|ss|sh)$', 'gi'),          '$1es'],
    [new RegExp('(matr|vert|ind)ix|ex$', 'gi'),  '$1ices'],
    [new RegExp('([m|l])ouse$', 'gi'),           '$1ice'],
    [new RegExp('(quiz)$', 'gi'),                '$1zes'],
    [new RegExp('s$', 'gi'),                     's'],
    [new RegExp('$', 'gi'),                      's']
]

singularRules = [
    [new RegExp('(m)en$', 'gi'),                                                       '$1an'],
    [new RegExp('(pe)ople$', 'gi'),                                                    '$1rson'],
    [new RegExp('(child)ren$', 'gi'),                                                  '$1'],
    [new RegExp('([ti])a$', 'gi'),                                                     '$1um'],
    [new RegExp('((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi'), '$1$2sis'],
    [new RegExp('(hive)s$', 'gi'),                                                     '$1'],
    [new RegExp('(tive)s$', 'gi'),                                                     '$1'],
    [new RegExp('(curve)s$', 'gi'),                                                    '$1'],
    [new RegExp('([lr])ves$', 'gi'),                                                   '$1f'],
    [new RegExp('([^fo])ves$', 'gi'),                                                  '$1fe'],
    [new RegExp('([^aeiouy]|qu)ies$', 'gi'),                                           '$1y'],
    [new RegExp('(s)eries$', 'gi'),                                                    '$1eries'],
    [new RegExp('(m)ovies$', 'gi'),                                                    '$1ovie'],
    [new RegExp('(x|ch|ss|sh)es$', 'gi'),                                              '$1'],
    [new RegExp('([m|l])ice$', 'gi'),                                                  '$1ouse'],
    [new RegExp('(bus)es$', 'gi'),                                                     '$1'],
    [new RegExp('(o)es$', 'gi'),                                                       '$1'],
    [new RegExp('(shoe)s$', 'gi'),                                                     '$1'],
    [new RegExp('(cris|ax|test)es$', 'gi'),                                            '$1is'],
    [new RegExp('(octop|vir)i$', 'gi'),                                                '$1us'],
    [new RegExp('(alias|status)es$', 'gi'),                                            '$1'],
    [new RegExp('^(ox)en', 'gi'),                                                      '$1'],
    [new RegExp('(vert|ind)ices$', 'gi'),                                              '$1ex'],
    [new RegExp('(matr)ices$', 'gi'),                                                  '$1ix'],
    [new RegExp('(quiz)zes$', 'gi'),                                                   '$1'],
    [new RegExp('s$', 'gi'),                                                           '']
]
applyRules = (str, rules, skip) ->
  if skip.indexOf str.toLowerCase() > -1
    for rule in rules
      if str.match(rule[0])
        str = str.replace rule[0], rule[1]
        break
  return str
 
     
module.exports =
  
  pluralize:(str) ->
    return applyRules str, pluralRules, uncountableWords

  singularize: (str) ->
    return applyRules str, singularRules, uncountableWords

  camelize: (str, lowFirstLetter) ->
    return str.replace /(?:^|_)([a-zA-Z])/g, (match, letter, position) ->
      if position == 0 and lowFirstLetter
        return letter

  underscore: (str) ->
    return str.replace(/_[A-Z]/, '$1')

  capitalize: (str) ->
    return str.substring(0, 1).toUpperCase() + str.substring(1)

  uncapitalize: (str) ->
    return str.substring(0, 1).toLowerCase() + str.substring(1)

  dasherize: (str) ->
    return str.replace(/\ _/g, '-');
