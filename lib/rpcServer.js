define(["uglify-js", "crypto"], function(uglify, crypto) {

  return function(socket) {
    return function(fn) {
      var ast = uglify.parser.parse("(" + fn.toString() + ")")
        , code = uglify.uglify.gen_code(ast[1][0][1], { indent_level: 2, beautify: true }) 
        , hash = crypto.createHash("md5")
                       .update(code)
                       .digest("hex")
        , that = this
      socket.on("LiveDocumentMethod" + hash, function(id) { 
        that.constructor.read({_id: id}, function(things) {
          fn.apply(things.at(0),[].slice.call(arguments, 1)) 
        })
      })
      return fn
    }
  }

})

