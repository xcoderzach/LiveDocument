Associations
============

  LiveDocument supports three types of associations
many, one, and belongsTo.

One
---

  A _one_ association defines a relationship where one document maps to one
other document.

```javascript
// app/models/user.js
module.exports = Document("User")
  .key("name") 
  .one("profile")
// app/models/profile.js
module.exports = Document("Profile")
  .key("jobTitle") 
  .one("user")
```

  To use this, you can just use the assoc method like this:

```javascript
var user = User.findOne(id)
var profile = user.assoc("profile")
```

  The associated document returned can be used just like any other
document and is not necessarily loaded.

Many
----

  A _many_ association defines a relationship where a one document has 0 or
more related documents.

  To define a _many_ association, you simply call the many method with the name
of the association.

```javascript
// app/models/blog_post.js
module.exports = Document("BlogPost")
  .key("title")
  .many("comments")
// app/models/comment.js
module.exports = Document("Comment")
  .key("body")
  .belongsTo("blogPost")
```

  Now to use the associations
```javascript
var post = BlogPost.findOne(id)
var comments = post.assoc("comments")
```
  This will find the model with the name Comment and return the comments with
a blogPostId equal to the blogPost's _id.  The comments can be interacted with
like any other collection.  So you can do things that won't happen until they're
loaded with the .loaded method.

  Many associations can also map to [embedded]() documents.

BelongsTo
---------

  The document with the belongsTo association is the document which actually has the
foreign key in it.  It can be used to access the document it belongs to exactly like
the other two associations.  Using the blog post example from above, we can access
the post to which a comment belongs like this:    

```javascript
var comment = Comment.findOne(id)
var post = comment.assoc("blogPost")
```
