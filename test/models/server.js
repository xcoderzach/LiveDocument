var Server = LiveDocument.define("Server")

Server.prototype.checkSecretRecipe = server(function(done) {
  done(this.isStillSecret())
})
