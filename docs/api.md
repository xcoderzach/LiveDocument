Document Definition Methods
---------------------------

  Model Definition Methods are the methods that you use to define the schema
and other properties of your documents.   These methods allow you to describe
keys on your documents, as well as validations and associations.

###key 

#####Document.key(name, [properties])

  To add properties to your document, use the `key` method.  The `name` is a
`String` which describes a property that will exist in instances of this
`Document`.

```javascript
module.exports = Document("Post")
  .key("title")
  .key("body", {required: false})
```

The following are the optional properties of a key

  * `required`: Determines whether a user must set a value for this key in
order for the document to save.

  * `default`: The default value of this key if none is set.

You can also specify validations for a key.  To see a list of validations, and
how to make your own custom validations, see the
[validations](/validations.html) page.

###timestamps

#####Document.timestamps()

  The `timestamps` method will give your document createdAt and updatedAt
timestamps.  The timestamps will be created and updated automatically.
The format of a timestamp is a unix timestamp, specifically the result
of calling `(new Date).getTime()`

To access the timestamps you can call [get("createdAt") or get("updatedAt")](/api.html#get)

```javascript
module.exports = Document("Post")
  //define the rest of your keys
  .timestamps()
``` 

###getKey

#####Document.getKey(name, watchFields, valueFn)
  
  The `getKey` method defines a dynamic key, whose value is determined by the
return value of valueFn.

  A change event "change:name" will be called when any of the fields listed in
watchFields changes.

`valueFn`

###setKey

#####Document.setKey(name, fn) 

  The setKey method allows you to define behavior when a key is set.

  The following example sets the first and last name property when
a user calls the `.set` method.


```javascript
module.exports = Document("Post")
  //define the rest of your keys
  .setKey("name", function(name) {
    name = name.split(" ")      
    this.set("first", name[0])
    this.set("last", name[1])
  })
```

Document Hook Methods
---------------------

  These methods registers a handler to be called before or after
some action is performed on a document.

In each of these methods, `fn` takes two arguments:

  * `instance` - The instance of the document

  * `done` - A function to call when your handler is finished.  If anything is
passed to done in a before filter, the document will not save and whatever was
passed to done will be emitted as the first argument to the `"error"` event.

```javascript
module.exports = Document("Post")
  .beforeSave(function(post, done) {
    post.isUnique("title", function(isUnique) {
      if(!isUnique) {
        done(new Error("title isn't unique"))
      } else {
        done()
      }
    })
  })
``` 
 
###beforeSave

#####Document.beforeSave(fn) 

  This is called before updating or creating a document.  It is
called on the client and the server.

###serverBeforeSave

#####Document.serverBeforeSave(fn)  

  This is called before updating or creating a document.  It is
called on the server.

###clientBeforeSave

#####Document.clientBeforeSave(fn)  

  This is called before updating or creating a document.  It is
called on the client.

###beforeCreate

#####Document.beforeCreate(fn) 

  This is called before creating a document on the both client and the server.

###serverBeforeCreate

#####Document.serverBeforeCreate(fn)   

  This is called before creating a document on the the server.

###clientBeforeCreate

#####Document.clientBeforeCreate(fn)   

  This is called before creating a document on the the client.

###afterSave

#####Document.afterSave(fn) 

  This is called after creating or updating a document on the both client and the server.

###serverAfterSave

#####Document.serverAfterSave(fn)   

  This is called after creating or updating a document on the server.
 
###afterRemove

#####Document.afterRemove(fn) 

  This is called after removing a document on the client or server.

###serverAfterRemove

#####Document.serverAfterRemove(fn)   

  This is called after removing a document on the server.

Associations
------------

  Associations provide a way to model relationships between your documents.
For example, `blogPosts` might have many `comments` and a `blogPost` might
belongTo an `author` or an `author` might have one `profile`.

  NOTE: A quick note about cyclic dependencies.  If two documents have each
other as associations, i.e. one belongs to another, then we need to do
the following:

```javascript

//comment.js
var Comment = Document("Comment")
  , Post = require("./post")

Comment
  .belongsTo(Post)

var Post = Document("Post")
  , Comment = require("./comment")

Post
  .many(Comment)
```

###many

#####Document.many(associatedModel[, opts])

  A `many` association describes a one-to-many association between
documents.

  The `associatedModel` argument is the Document which we are associating.

```javascript
var Comment = require("./comment")

module.exports = Document("Post")
  .many(Comment)
```

Opts accepts the following options: 

  * `dependent` - Specifies whether the associated document should be
deleted when this document is deleted, defaults to `false`

  * `foreignKey` - The foreignKey on the associated document.  Defaults
to `documentNameId` (e.g. a comment with a post will have the key, postId) 

  * `as` - The name of the association, if you want to refer to a post's
comments as `messages`, you would pass `{ as: "message" }`.

  * `conditions` - An list of conditions the associated documents will be
queried with.

###one

#####Document.one(associatedModel[, opts])

  A `one` association describes a one-to-one association between two
documents.

  associatedModel is the Document which we are associating.

```javascript
var Profile = require("./profile")

module.exports = Document("User")
  .one(Profile)
```

Opts accepts the following options: 

  * `dependent` - Specifies whether the associated document should be
deleted when this document is deleted, defaults to `false`

  * `foreignKey` - The foreignKey on the associated document.  Defaults
to `documentNameId` (e.g. an author with a profile will have the key, authorId) 

  * `as` - The name of the association, if you want to refer to a user's
profile as `bio`, you would pass `{ as: "bio" }`.
 
###belongsTo

#####Document.belongsTo(associatedModel[, opts])

Document Helper Methods
-----------------------

###find

#####Document.find(query[, callback]) 

###findOne

#####Document.findOne(id[, callback])  

###findByKey

#####Document.findOne(key, value[, callback])   

###create

#####Document.create(document[, callback])
 
