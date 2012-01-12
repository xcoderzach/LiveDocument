var LiveDocument = require("../index")

var Thing = LiveDocument.define("Thing")
  .key("title", { length: [3,24] })
  .key("description", { max: 140 })
  .key("hideme", { max: 140, canRead: false})
  .key("metoo", { max: 140, canRead: false})
 
describe("when I scrub a document", function() {
  it("should have the non scrubbed values",function() {
    var scrubbed = Thing.scrub([{title:"herp", description: "derp"}], "read")
    scrubbed[0].title.should.equal("herp")
    scrubbed[0].description.should.equal("derp")
  })

  it("should not have the scrubbed values",function() {
    var scrubbed = Thing.scrub([{title:"herp", description: "derp", hideme: "hidden", metoo: "bye"}], "read")
    scrubbed[0].title.should.equal("herp")
    scrubbed[0].description.should.equal("derp")
    ;(typeof scrubbed[0].hideme).should.equal("undefined")
    ;(typeof scrubbed[0].metoo).should.equal("undefined")
  })
})
