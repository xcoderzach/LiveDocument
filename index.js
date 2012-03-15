if(process.platform === "browser") {
  module.exports = require("./lib/document")
} else {
  module.exports = require("./lib/server")
}
