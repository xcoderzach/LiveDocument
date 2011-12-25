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
  
###Example

  LiveDocument
    @key "title" { length: [3...24] }
    @key "description" { max: 140 }

