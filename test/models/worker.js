var LiveDocument = require("../../lib/document")

module.exports = LiveDocument.define("Worker")
  .key("name", { length: [3,24] })
  .many(require("./task"), { dependent: true }) 
