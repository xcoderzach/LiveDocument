LiveDocument API
================

Document Definition Methods
---------------------------

  Model Definition Methods are the methods that you use to define the schema
and other properties of your documents.   These methods allow you to describe
keys on your documents, as well as validations and associations.

###key 

####Document.key(name, [properties])

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

####Document.timestamps()

  The `timestamps` method will give your document `createdAt` and `updatedAt`
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

####Document.getKey(name, watchFields, valueFn)
  
  The `getKey` method defines a dynamic key whose value is determined by the
return value of valueFn.

  A change event "change:name" will be called when any of the fields listed in
watchFields changes.

```javascript
User = Document("User")
  .getKey("fullName", ["first", "last"], function () {
    return this.get("first") + " " + this.get("last")
  })
```

###setKey

####Document.setKey(name, fn) 

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

  These methods register a handler to be called before or after
some action is performed on a document.

In each of these methods, `fn` takes two arguments:

  * `instance` - The instance of the document

  * `done` - A function to be called when your handler is finished.  If anything is
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

####Document.beforeSave(fn) 

  This is called before updating or creating a document.  It is
called on the client and the server.

###serverBeforeSave

####Document.serverBeforeSave(fn)  

  This is called before updating or creating a document.  It is
called on the server.

###clientBeforeSave

####Document.clientBeforeSave(fn)  

  This is called before updating or creating a document.  It is
called on the client.

###beforeCreate

####Document.beforeCreate(fn) 

  This is called before creating a document on the both client and the server.

###serverBeforeCreate

####Document.serverBeforeCreate(fn)   

  This is called before creating a document on the the server.

###clientBeforeCreate

####Document.clientBeforeCreate(fn)   

  This is called before creating a document on the the client.

###afterSave

####Document.afterSave(fn) 

  This is called after creating or updating a document on the both client and the server.

###serverAfterSave

####Document.serverAfterSave(fn)   

  This is called after creating or updating a document on the server.
 
###afterRemove

####Document.afterRemove(fn) 

  This is called after removing a document on the client or server.

###serverAfterRemove

####Document.serverAfterRemove(fn)   

  This is called after removing a document on the server.

Document Association Methods
----------------------------

  Associations provide a way to model relationships between your documents.
For example, `blogPosts` might have many `comments` and a `blogPost` might
belongTo an `author` or an `author` might have one `profile`.

  **NOTE**: A quick note about cyclic dependencies.  If two documents have each
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

####Document.many(associatedModel[, opts])

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

####Document.one(associatedModel[, opts])

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

####Document.belongsTo(associatedModel[, opts])

  A `belongsTo` association describes a one-to-one or one-to-many association
where the document belongs to (has the foriegn key of) another document.  For
example, `comments` belong to a `blogPost`, a `profile` belongs to a `user`.

  It specifies the reverse association of `one` and `many`.
 
```javascript
var Post = require("./post")
module.exports = Document("Comment")
  .belongsTo(Post)
```

Document Helper Methods
-----------------------

###find

####Document.find(query[, callback]) 

  The `find` method takes in a query and returns a `Collection`.
A query is simply a mongodb query object.

See [this page](http://www.mongodb.org/display/DOCS/Advanced+Queries) for more on queries.
 

  Here is an example that will find all posts with 100 or more votes.
```javascript
//post.js
module.exports = Document("Post")
  .key("votes")

var post = Post.find({votes: { $gt: 100 })
```
 
###findOne

####Document.findOne(id[, callback])  

  `findOne` takes in an `_id`, and finds a document with that id.  The document is
returned immediatly, however none of it's properties are actually set.  However
you can, and should, pass it to the view immediatly.  The document will fire
[events](/document-events) as it's state changes (i.e. when it loads, or

  If you do for some reason need to wait for the post to load first, you can

pass in a callback as the second argument to findOne, or pass a callback to the
`.load` method on the returned instance.  

```javascript
//post.js
module.exports = Document("Post")

//myCode.js
var Post = require("./post")

var post = Post.findOne("4f7580a64e822029b7000001") 
```

###findByKey

####Document.findByKey(key, value[, callback])   

Finds the document in which `key` equals `value`, there should
only be one document where `key` equals `value`. i.e. `value`
should be unique.

```javascript
//user.js
module.exports = Document("User")
  .key("email")

var user = User.findByKey("email", "x.coder.zach[At]gmail.com") 
``` 

This example finds a user by email address.

###create

####Document.create(document[, callback])

This is simply a utility method for the following:

```javascript
module.exports = Document("User")
  .key("name")
  .key("email")

var user = User.create({ name: "Zach", email: "x.coder.zach[At]gmail.com" })

//this is equivelent to 

var user = new User({ name: "Zach", email: "x.coder.zach[At]gmail.com" })
user.save()
```

Document Instance Methods
-----------------------

###constructor

####Document(JSONDocument[, options])

Constructs a new document instance.

Options:
  * validate - defaults to `true`. Specifies whether to value the contents of the JSONDocument.
  * noId - defaults to `false`. If `noId` is `true`, constructor does not generate an id.

###set

####Document.prototype.set(properies[, options])

####Document.prototype.set(key, value[, options])

Sets the value of `key` to `value`. If the first parameter is an object, sets the value of each `key` in the document to its `value`.

###get
####Document.prototype.get(key)

Gets the value of the `key`.

###assoc
####Document.prototype.assoc(name[, callback])

Returns associated document or collection. `callback` is called once association is loaded.

###keys
####Document.prototype.keys()

Returns a list of the keys this document has.

###save
####Document.prototype.save([callback])

If the document does not exist, creates the document. If the document already exists, saves the document.

###remove
####Document.prototype.remove([callback])

Removes the document from the DB. Callback is called once document has been removed successfully.

###manyAssocs
####Document.prototype.manyAssocs()

Returns a list of the many associations this document has.

```javascript
module.exports = Document("Post")
  .many("comments")


var post = new Post()
post.manyAssocs() // ["comments"]
``` 

###oneAssocs
####Document.prototype.oneAssocs()

This is the names of one assocs, as well as belongsTo assocs, since they both
point to one document.

```javascript
module.exports = Document("Post")
  .one("thing")
  .belongsTo("author")


var post = new Post()
post.oneAssocs() // ["thing", "author"]
``` 

###assocs
####Document.prototype.assocs()
  Returns a list of the names of all associations for this document.

```javascript
module.exports = Document("Post")
  .many("comments")
  .belongsTo("author")


var post = new Post()
post.assocs() // ["comments", "author"]

```

###validate
####Document.prototype.validate([callback, opts])

Forces the document to validate.  This method is called automatically
everytime a value is changed with .set().  This will emit `valid` or
`invalid` events.

```javascript
var post = new Post()
post.on("invalid", function() {

})
post.validate(function(post, invalidFields) {
                         
})

```

###validateField
####Document.prototype.validateField(field[, callback, opts])

Validates the contents of a specified `field`. `callback` is called when finished. If the field is invalid, the second parameter to `callback` will be a list of failed validations.

Options:
  * silent - If true, doesn't emit an event.

###isUnique
####Document.prototype.isUnique(field, value, callback)

Calls callback with `true` as the first argument if the field is
unique, otherwise it calls it with `false`

```javascript
  Post.isUnique("email", "x.coder.zach{At}gmail.com", function(isUnique) {
    isUnique //true if is unique, false otherwise.            
  })
```

  You can Define your own instance methods like so:
```javascript
  //Every type of document will get this method
  Document.prototype.myMethod = function() {

  }

  //Just Posts will get this method
  Post.prototype.myMethod = function() {

  }
```

Document Instance Events
------------------------

  There are a lot of events a document can emit as it's state changes.
Here's a list of all of them in one place, so you don't have to hunt around.

  The first argument for all event callbacks is the instance itself, all event
  handlers are bound to the instance.

### "saving"
 
  Emitted when the document starts saving.
  
### "saved"

  Emitted when the document finishes saving.

### "load"

  Emitted once the document has loaded.

### "change"

  Emitted when a field on the document changes.
  The second parameter is a list of fields that changed.

### "change:field"

  Emitted when field, `field`, on the document changes.
  The second parameter is the new value of the field,
  the third parameter is the old value.

### "delete"

  Emitted when the document is deleted.

### "notExist"

  Emitted when the document in the database that this document refers to
doesn't actually exist.

### "invalid"

  Emitted when a document becomes invalid, this happens as soon as set is
called with invalid data, in order to do responsive real-time error reporting.

### "invalid:field"

  Emitted when a field, `field` in the document becomes invalid, this happens
  as soon as set is called with invalid data, in order to do responsive
  real-time error reporting.

### "valid"
  
  Emitted when new data is validated and is in fact valid.

### "valid:field"

  Emitted when a particular field is validated and is in fact valid.

### "error"
 
  Emitted when there is an error with the document, right now this only
happens when an error is passed into the done method of after save.

Collection Methods
------------------

  A collection is a list of documents, usually returned by the find()
method.

  This example returns a collection of all tasks in the database.
```
var tasks = Task.find()
```

###at
####Collection.prototype.at(index)

  Returns the Document at index `index`.

```javascript
var firstTask = tasks.at(0)
```

###length
####collection.length

  This isn't a method, but collections have a length property, the length of the collection

###get
####Collection.prototype.get(id)

  This returns the document with _id equal to id.

###sortBy
####Collection.prototype.sortBy(field[, reverse])

  Sorts collection by `field`. If reverse is true, then it's in reverse order.
Reverse order is descending. Normal order is ascending.

###filter
####Collection.prototype.filter(fn)

  Filters the collection by fn, if fn returns true, the document is added to
the collection.

```javascript
collection.filter(function(document) {
  return document.get("votes") > 100
})
```

###load
####Collection.prototype.load(fn)

  Called once the collection is loaded, unless it already is, then it's called
immediately.
