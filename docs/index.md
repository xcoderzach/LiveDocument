LiveDocument
============

  LiveDocument is a client and server side MongoDB object document mapper.  The
client and server components work seamlessly together to allow you to build
your app without having to write all of your model code twice.

Install
=======

```zsh
npm install LiveDocument
```

Requirements
============

  * Connect (or express)
  * AssetPipeline
  * Socket.io

Getting Started
===============

  On the server:

```javascript
var DocumentServer = require("live_document/lib/server")
  , AssetPipeline  = require("asset_pipeline")
  , connect        = require("connect")
  , io             = require("socket.io")
  , paths          = require("paths")
  , app

app = connect()
app.use(DocumentServer.middleware())
app.use(AssetPipeline.middleware())
app.listen(3000)

io.listen(app)

// Define the models that we want to serve
DocumentServer.models(paths.join(__dirname, "app/models"))

// The socket.io object
DocumentServer.socket(io)
```

  On the client, we first define a model:
```
// this should be the file /app/models/blog_post.js
var Document = require("live_document")

module.exports = Document("BlogPost")
  .key("title", { length: [3, 10], required: true })
  .key("description", { required: false })
  .key("content")
```

