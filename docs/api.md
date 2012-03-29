Documents

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
  
  The getKey method defines a dynamic key, whose value is determined by the
return value of valueFn.

  A change event "change:name" will be called when any of the fields listed in
watchFields changes.

`valueFn`

