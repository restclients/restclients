const parser = require("./parser")();

describe("parser", function () {
  it("parser seperator", function () {
    const exprs = parser("###\n", false);
    expect(exprs).toBe({ type: "seperator", value: [] });
  });
});
