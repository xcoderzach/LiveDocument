LiveDocumentClient
==================

  LiveDocument is an client/server isopmorphic ODM.  The goal of LiveDocument
is to provide a seamless way to interact with a mongodb database on the client,
without duplication of effort writing both a client side and a server side
models. 

  LiveDocument also provides real-time updates out of the box.  After you query
something from the database, LiveDocument notifies you of any documents that
are created, updated, or deleted and match your criteria.  If you ask for a
single document, any changes made to that document will automatically be pushed
to you.

  * [Example](#example)
  * [Motivation](#motivation)
  * [API docs](#api)
  * [Tests](#tests)
  * [Contributors](#contributors)
  * [License](#license)


[#example]: &nbsp;
Example
-------

  In coffeescript:

```coffeescript
class Task extends LiveDocument
  @key "title", { length: [3...24] }
  @key "description", { max: 140 }

task = new Task({title: "Work that needs to be done", description: "This is some important work", priority:10})
task.save()

# or 

Task.create({title: "Clean carpet", description: "Clean the carpets, they're gross", priority: 4})

task = Task.findOne({title: "This is my title"})

task.on "load", (tasks) ->
  console.log(task.get("priority")) # 10

task.on "update", (task) ->
  #called when someone updates this task

task.on "delete", (task) ->
  #called when someone deletes this task

#this runs any time priority changes
task.get "priority" (val) ->
  console.log(val) # 10

task.get "priority" (key, val) ->
  console.log(key) # priority
  console.log(val) # 10
# this binds tasks get to views set binding
task.get "priority", view.set
# this binds all properties
task.get view.set

# mongodb style queries, if it"s supported by mongo, we should support it (not
# true atm!)

tasks = Task.find({priority: {$lt: 10}})

tasks.on "load", (tasks) ->
  # called when the tasks have been loaded from the datasource

tasks.on "insert", (tasks) ->
  # called when a document is created that matches the criteria
  # or an existing document is updated in such a way that it
  # now matches the criteria

tasks.on "remove", (tasks) ->
  # called when a document is deleted that matches the criteria
  # or an document is updated in such a way that it no longer
  # matches the criteria

```
 
[motivation]: &nbsp;
Motivation
----------

[api]: &nbsp;
API 
----------

Validation
----------

  Model validation happens on both the client and the server when possible.
Input is validated on the client first if possible, to provide a responsive
user experience.  The model is then validated again on the server, in order to
catch people bypassing client side validation, as well as doing validations
that can only happen on the server, such as checking if an email address is
taken.

####Error Messages

  Validations do not give you error messages.  They do not allow you to set
error messages.  Error messages belong in the view.

  All of the declarative LiveDocument class methods, return this, allowing you
to chain them together.

[contributors]: &nbsp;
Contributors
------------

  * Zach Smith
  * Eugene Butler
  * Chad Seibert

[license]: &nbsp;
License
-------

  Licensed under MIT (see LICENSE file)
