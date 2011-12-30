define(["fs", "crypto", "uglify-js", "traverse"], function(fs, crypto, uglify, traverse) {

  function AssetServer(opts) {

    return function(req, res, next) {
      fs.readFile(opts.input, function(err, file) {
        var ast
          , newCode
        if(req.url === opts.output) {
          ast = uglify.parser.parse(file.toString())

          traverse(ast).forEach(function(node) {
            var fnStr
              , hash
              , newValue

            if(!  this.isRoot 
               && this.parent.node[0] === "call" // if the parent node is a function call
               && this.parent.node[2] === node // and the current node is the arguments list
               && this.parent.node[1][0] === "name" 
               && this.parent.node[1][1] === "server") { //and the name of the function being called is server
              //THEN WE MANGLE THE AST w000000t!
              newValue = []
              for (var i = 0; i < node.length; i++) {
                fnStr = uglify.uglify.gen_code(node[i], { indent_level: 2, beautify: true })

                hash = crypto.createHash("md5")
                             .update(fnStr)
                             .digest("hex")

                newValue[i] = ["string", hash]
              }
              this.update(newValue)
            }
          })
          newCode = uglify.uglify.gen_code(ast, { indent_level: 2, beautify: true })
      
          res.writeHead(200, { 'Content-Length': newCode.length, 'Content-Type': 'text/javascript'})
          res.write(newCode, 'utf-8')
          res.end() 

        } else {
          next()
        }
      }) 
    }
  }

  return AssetServer
})
