LiveDocument
============

  LiveDocument is a client and server side MongoDB object document mapper.  The
client and server components work seamlessly together to allow you to build
your app without having to write all of your model code twice.

##Install

```zsh
npm install LiveDocument
```

##Requirements

  * Connect (or express)
  * AssetPipeline
  * Socket.io

##Getting Started

LiveDocument is still in alpha and hasn't been optimized for use
by itself, it requires the asset provider to serve it's assets
as well as the require function for module support.

##Setting up the Server

  Here are the basics, without the asset Provider stuff
  On the server:

```javascript
var DocumentServer = require("live_document").Server
  , connect        = require("connect")
  , io             = require("socket.io")
  , paths          = require("paths")
  , app

app = connect()
app.use(DocumentServer())
app.listen(3000)

io.listen(app)

// Define the models that we want to serve

// The socket.io object
DocumentServer.socket(io)
```

##Defining your Models

  Define a model:
```javascript
// this should be the file /app/models/blog_post.js
var Document = require("live_document")

module.exports = Document("BlogPost")
  .key("title", { length: [3, 10], required: true })
  .key("description", { required: false })
  .key("content")
  .key("upvotes")
```
```coffeescript
Document = require "live_document"

class BlogPost extends Document
  @key "title", length: [3, 10], required: true
  @key "description", required: false
  @key "content"
  @key "upvotes"
```

  The key method defines the properties your document will have and any
[validations](./validations.html) for those properties.  You can also
describe any [associations](./associations.html) here too.

##The Basics

###Creating Things


```javascript
//path should be relative to your current file
var BlogPost = require("./app/models/blog_post")

var post = BlogPost.create({ title: "Space Magic is magic"
                           , description: "This Space Magic framework is totally boss bro."
                           , content: "So many words about how awesome this is.  SO MANY WORDS" })
```
```coffeescript
BlogPost = require "./app/models/blog_post"
post = BlogPost.create title: "SpaceMagic is magic"
                     , description: "This Space Magic framework is totally boss bro."
                     , content: "So many words about how awesome this is.  SO MANY WORDS"
```
  
  An important thing to note is that the post is populated and ready to go
right away.  The [id](./about_ids) is generated on the client, and the instance
is ready to be handed to your view right away.  This makes your app much more
responsive.  Also, since validation was handled client side, just assume that
everything is going to work out and notify the user of any errors later, if
they happen. [Read more about how ids work here](./about_ids)

Furthur reading:
[Great article by Alex MacCaw about async UIs](http://alexmaccaw.com/posts/async_ui)

###Finding Things

```javascript
//path should be relative to your current file
var BlogPost = require("./app/models/blog_post")

var popularPosts = BlogPost.find({ upvotes: $gt: 100 })
//once the posts load, log their titles

popularPosts.loaded.each(function(post) { 
  console.log(post.get("title")) 
}) 
```
```coffeescript
# path should be relative to your current file
BlogPost = require "./app/models/blog_post"

popularPosts = BlogPost.find upvotes: { $gt: 100 }

popularPosts.loaded.each (post) ->
  console.log post.get("title")
```

  The [find method](./collections.html#find) returns a
[collection](./collections.html) of documents based on your
[query](./collections.html#query).  The collection returned is ready to be
passed to a view, but will in many cases be empty.  Unless the contents have
already been retrieved or we have a cache of the documents.

  You can use the method [collection.loaded](./collections.html#loaded) which
will not be invoked until the method has loaded, if the method was already
loaded it will be invoked immediately, loaded can also take a function, that
will execute once the collection loads, or fire immediately if the collection
has already loaded.  

  All of the underscore collection methods are also available on the collection
and on collection.loaded.

Further Reading
[Collection Events](./collections.html#events)
[Collection Methods](./collections.html#methods)

###Finding One Thing

```javascript
var BlogPost = require("./app/models/blog_post")

var postByTitle = BlogPost.findOne({title: "SpaceMagic is magic"})
var postById    = BlogPost.findOne(id)
```

  Now we have a thing, again, we should use this object right away, and display
anything we have as soon as possible, rather than waiting for the post to load
before setting up the view.  

Further reading:
[Document Events](./documents.html#events)
[Document Methods](./documents.html#methods)

###Updating Things

```javascript
var BlogPost = require("./app/models/blog_post")

var post = BlogPost.findOne(id)
post.set({ title: "The new title for this blog post" })
post.save()
``` 

  Pretty simple, you can set any of the keys defined in your model, and then
the save method persists the changes to the database.  The "saving" event is
fired when the document starts saving and "saved" is fired when it is complete.

###Deleting Things

```javascript
var BlogPost = require("./app/models/blog_post")

var post = BlogPost.findOne(id)
post.destroy()
``` 

  Thats all it takes to delete something.  It fires the "destroying" event
when it starts deleting and the "destroyed" event when it completes.  

##Real-Time

  Enough with the boring object document mapping stuff lets make our app 
real-time.

  I'll break all the code into two sections, client 1 and client 2.  Clients 
1 and 2 could be on the same page, in two different tabs in the same browser,
in two different browsers on the same computer, or on two seperate computers.
It doesn't really matter.  

###Real-Time Collections

```javascript
//client 1 finds all of the blog posts
var posts = BlogPost.find({upvotes: { $gt:10 }})

posts.on("insert", function(post) {
  console.log("inserted: " + post.get("title")) 
})

posts.on("remove", function(post) {
  console.log("removed: " + post.get("title")) 
})
//client 2
var post1 = BlogPost.create({ title: "A new blog post"
                            , content: "post content" 
                            , upvotes: 9 })

var post2 = BlogPost.create({ title: "A blog post with 11 upvotes"
                            , content: "post content" 
                            , upvotes: 11 })
```
  Client 1 will log "inserted: A blog post with 11 updates" but will not log "inserted: A new blog
post" since it las less than 10 upvotes.

  Going off the previous example
```javascript
//client 2
post1.set({upvotes: 100})
post2.set({upvotes: 9})
```

  If we give post one more upvotes and give post two some downvotes client 1
will log the following:

  "inserted: A new blog post"
  "removed: A blog post with 11 upvotes"

since post2 no longer fits the criterion client 1 is interested in

###Real-Time Documents

  Lets assume we have a blog post in the database with the title "A Title"
```javascript
//client 1
var post = BlogPost.find({title: "A title"})
post.on("change", function(post, changedFields) {
  _(changedFields).each(function(field) {
    console.log(field + " changed to: " + post.get(field))
  })
})
//client 2
var post = BlogPost.find({title: "A title"})
post.set({description: "describe"})
post.save()
```

  This will log "description changed to: describe" on client 1.  If two users
update the same property at the same time, the last one will overwrite the
other.  It's possible that they will momentarily have inconsistant states, but
eventually a message will be broadcast to all users who are currently
"interested" in the document what the final state is, and the clients will
converge.  

  For many things this behavior will work just fine.  However, if you do not
want updates to just overwrite, you should read the section on
[collaboration](./collaboration.html).

  If we were to delete either of the posts a "destroyed" event would be fired.

Further reading;
[collaboration](./collaboration.html)
