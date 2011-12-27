{ ConditionalMatcher } =require("../index").LiveDocumentMongo
test = require("assert")

describe "ConditionalMatcher", ->
  describe "matching equality", ->
    it "should match", ->
      test.ok(ConditionalMatcher.match({derp: "herp", name:"Zach"}, {derp: "herp"}), "No Match")
      test.ok(!ConditionalMatcher.match({derp: "herp", name:"Zach"}, {derp: "berp"}), "False match")

  describe "matching less than", ->
    it "should match", ->
      test.ok(ConditionalMatcher.match({derp: 9, name:"Zach"}, {derp: {$lt: 10}}), "No Match")
      test.ok(!ConditionalMatcher.match({derp: 11, name:"Zach"}, {derp: {$lt: 10}}), "No Match")

  describe "matching less than or equal to", ->
    it "should match", ->
      test.ok(ConditionalMatcher.match({derp: 9, name:"Zach"}, {derp: {$lte: 10}}), "No Match")
      test.ok(ConditionalMatcher.match({derp: 10, name:"Zach"}, {derp: {$lte: 10}}), "No Match")
      test.ok(!ConditionalMatcher.match({derp: 11, name:"Zach"}, {derp: {$lte: 10}}), "No Match")

  describe "matching greater than", ->
    it "should match", ->
      test.ok(!ConditionalMatcher.match({derp: 9, name:"Zach"}, {derp: {$gt: 10}}), "No Match")
      test.ok(ConditionalMatcher.match({derp: 11, name:"Zach"}, {derp: {$gt: 10}}), "No Match")
 
  describe "matching less than or equal to", ->
    it "should match", ->
      test.ok(!ConditionalMatcher.match({derp: 9, name:"Zach"}, {derp: {$gte: 10}}), "No Match")
      test.ok(ConditionalMatcher.match({derp: 10, name:"Zach"}, {derp: {$gte: 10}}), "No Match")
      test.ok(ConditionalMatcher.match({derp: 11, name:"Zach"}, {derp: {$gte: 10}}), "No Match")

  # this should be a fuzz test
  # throw hella permutations at it
  describe "matching the things", ->
    it "should match", ->
      document = {derp: 9, num: 30, a:4, b:6, name:"Zach"}
      query = {name: "Zach", derp: {$gte: 7}, num: {$gt: 1}, a: {$lt: 100}, b: {$lt: 100}}
      test.ok(ConditionalMatcher.match(document, query), "No Match")
