if (typeof define !== 'function') { var define = (require('amdefine'))(module); }

define( ["uglify-js", "crypto"]
      , function(uglify, crypto) {
  var uglify = require("uglify-js")
    , crypto = require("crypto")

  module.exports = function(socket) {
    return function(fn) {
      var ast = uglify.parser.parse("(" + fn.toString() + ")")
        , code = uglify.uglify.gen_code(ast[1][0][1], { indent_level: 2, beautify: true }) 
        , hash = crypto.createHash("md5")
                       .update(code)
                       .digest("hex")
        , that = this
      socket.on("LiveDocumentMethod" + hash, function(id) { 
        var args = arguments
        that.read({_id: id}, function(things) {
          fn.apply(things.at(0),[].slice.call(args, 1)) 
        })
      })
      return fn
    }
  }
      })
