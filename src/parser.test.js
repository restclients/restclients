const parser = require("./parser")();

describe("parser seperator", function () {
  it("###", function () {
    const exprs = parser("###", false);
    expect(exprs).toEqual([{ type: "seperator", value: [] }]);
  });

  it("###", function () {
    const exprs = parser("###\n", false);
    expect(exprs).toEqual([{ type: "seperator", value: [] }]);
  });

  it("with comments 'ddddd'", function () {
    const exprs = parser("###ddddd\n", false);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });

  it("with comments 'd'", function () {
    const exprs = parser("###d\n", false);
    expect(exprs).toEqual([{ type: "seperator", value: ["d"] }]);
  });

  it("with comments '   ddddd     '", function () {
    const exprs = parser("###   ddddd     \n", false);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });

  it("with comments '   \tddddd     '", function () {
    const exprs = parser("###   \tddddd     \n", false);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });
});

describe("parser meta type prompt", function () {
  it("with", function () {
    const exprs = parser("# @prompt\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @prompt     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @prompt aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @prompt aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa", "description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @prompt   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa", "description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @prompt a b\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "a", "b"] }]);
  });
});

describe("parser meta type note", function () {
  it("with", function () {
    const exprs = parser("# @note\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @note     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @note aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @note aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @note   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @note a\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "a"] }]);
  });
});

describe("parser meta type name", function () {
  it("with", function () {
    const exprs = parser("# @name\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @name     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @name aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @name aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @name   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @name a\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "a"] }]);
  });
});

describe("parser meta type no redirect", function () {
  it("with", function () {
    const exprs = parser("# @no-redirect\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @no-redirect     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @no-redirect aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @no-redirect aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @no-redirect   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @no-redirect a\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "a"] }]);
  });
});

describe("parser meta type no cookie jar", function () {
  it("with", function () {
    const exprs = parser("# @no-cookie-jar\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @no-cookie-jar     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @no-cookie-jar aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @no-cookie-jar aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @no-cookie-jar   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @no-cookie-jar a\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "a"] }]);
  });
});

describe("parser meta type comment", function () {
  it("with#", function () {
    const exprs = parser("##\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", "#"] }]);
  });

  it("with #", function () {
    const exprs = parser("# #\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "#"] }]);
  });

  it("with", function () {
    const exprs = parser("#\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment"] }]);
  });

  it("with @names", function () {
    const exprs = parser("# @names\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "@names"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @name     \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @name aa\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @name aa description info\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @name   aa  description info \n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @name a\n", false);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "a"] }]);
  });
});