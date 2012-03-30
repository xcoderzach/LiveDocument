QueryMatcher = require("../lib/server/query_matcher")
test = require("assert")

describe "QueryMatcher", ->
  describe "matching equality", ->
    it "should match", ->
      test.ok(QueryMatcher.match({derp: "herp", name:"Zach"}, {derp: "herp"}), "No Match")
      test.ok(!QueryMatcher.match({derp: "herp", name:"Zach"}, {derp: "berp"}), "False match")

  describe "matching less than", ->
    it "should match", ->
      test.ok(QueryMatcher.match({derp: 9, name:"Zach"}, {derp: {$lt: 10}}), "No Match")
      test.ok(!QueryMatcher.match({derp: 11, name:"Zach"}, {derp: {$lt: 10}}), "No Match")

  describe "matching less than or equal to", ->
    it "should match", ->
      test.ok(QueryMatcher.match({derp: 9, name:"Zach"}, {derp: {$lte: 10}}), "No Match")
      test.ok(QueryMatcher.match({derp: 10, name:"Zach"}, {derp: {$lte: 10}}), "No Match")
      test.ok(!QueryMatcher.match({derp: 11, name:"Zach"}, {derp: {$lte: 10}}), "No Match")

  describe "matching greater than", ->
    it "should match", ->
      test.ok(!QueryMatcher.match({derp: 9, name:"Zach"}, {derp: {$gt: 10}}), "No Match")
      test.ok(QueryMatcher.match({derp: 11, name:"Zach"}, {derp: {$gt: 10}}), "No Match")
 
  describe "matching less than or equal to", ->
    it "should match", ->
      test.ok(!QueryMatcher.match({derp: 9, name:"Zach"}, {derp: {$gte: 10}}), "No Match")
      test.ok(QueryMatcher.match({derp: 10, name:"Zach"}, {derp: {$gte: 10}}), "No Match")
      test.ok(QueryMatcher.match({derp: 11, name:"Zach"}, {derp: {$gte: 10}}), "No Match")

  # this should be a fuzz test
  # throw hella permutations at it
  describe "matching the things", ->
    it "should match", ->
      document = {derp: 9, num: 30, a:4, b:6, name:"Zach"}
      query = {name: "Zach", derp: {$gte: 7}, num: {$gt: 1}, a: {$lt: 100}, b: {$lt: 100}}
      test.ok(QueryMatcher.match(document, query), "No Match")
