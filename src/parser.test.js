const { describe, expect, it } = require("@jest/globals");
const parser = require("./parser")["parser"]();
// const tokenizer = require("./parser").tokenizer;

describe("parser blank line", function () {
  it("with", function () {
    const exprs = parser("", true);
    expect(exprs).toEqual([]);
  });

  it("with/", function () {
    const exprs = parser("/", true);
    expect(exprs).toEqual([{ type: "url", value: ["GET", "/"] }]);
  });

  it("with\n", function () {
    const exprs = parser("\n", true);
    expect(exprs).toEqual([{ type: "seperator", value: null }]);
  });

  it("with\t", function () {
    const exprs = parser("\t", true);
    expect(exprs).toEqual([{ type: "seperator", value: null }]);
  });

  it("with   ", function () {
    const exprs = parser("   ", true);
    expect(exprs).toEqual([{ type: "seperator", value: null }]);
  });

  it("with  \t ", function () {
    const exprs = parser("  \t ", true);
    expect(exprs).toEqual([{ type: "seperator", value: null }]);
  });
});

describe("parser seperator", function () {
  it("with ###", function () {
    const exprs = parser("###", true);
    expect(exprs).toEqual([{ type: "seperator", value: [] }]);
  });

  it("with ###\n", function () {
    const exprs = parser("###\n", true);
    expect(exprs).toEqual([{ type: "seperator", value: [] }]);
  });

  it("with comments 'ddddd'", function () {
    const exprs = parser("###ddddd\n", true);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });

  it("with comments 'd'", function () {
    const exprs = parser("###d\n", true);
    expect(exprs).toEqual([{ type: "seperator", value: ["d"] }]);
  });

  it("with comments '   ddddd     '", function () {
    const exprs = parser("###   ddddd     \n", true);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });

  it("with comments '   \tddddd     '", function () {
    const exprs = parser("###   \tddddd     \n", true);
    expect(exprs).toEqual([{ type: "seperator", value: ["ddddd"] }]);
  });
});

describe("parser meta type prompt", function () {
  it("with", function () {
    const exprs = parser("# @prompt\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @prompt     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @prompt aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @prompt aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa", "description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @prompt   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa", "description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @prompt a b\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "a", "b"] }]);
  });

  it("// with", function () {
    const exprs = parser("// @prompt\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   @prompt   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "aa", "description info"] }]);
  });

  it("// with a b", function () {
    const exprs = parser("// @prompt a b\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@prompt", "a", "b"] }]);
  });
});

describe("parser meta type note", function () {
  it("with", function () {
    const exprs = parser("# @note\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @note     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @note aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @note aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @note   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa  description info"] }]);
  });

  it("with a", function () {
    const exprs = parser("# @note a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "a"] }]);
  });

  it("// with", function () {
    const exprs = parser("// @note\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   @note   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "aa  description info"] }]);
  });

  it("// with a", function () {
    const exprs = parser("// @note a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@note", "a"] }]);
  });
});

describe("parser meta type name", function () {
  it("with", function () {
    const exprs = parser("# @name\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @name     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @name aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @name aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @name   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa  description info"] }]);
  });

  it("with a", function () {
    const exprs = parser("# @name a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "a"] }]);
  });

  it("// with", function () {
    const exprs = parser("// @name\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   @name   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "aa  description info"] }]);
  });

  it("// with a", function () {
    const exprs = parser("// @name a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@name", "a"] }]);
  });
});

describe("parser meta type no redirect", function () {
  it("with", function () {
    const exprs = parser("# @no-redirect\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @no-redirect     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @no-redirect aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @no-redirect aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @no-redirect   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @no-redirect a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "a"] }]);
  });

  it("// with", function () {
    const exprs = parser("// @no-redirect\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   @no-redirect   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "aa  description info"] }]);
  });

  it("// with a", function () {
    const exprs = parser("// @no-redirect a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-redirect", "a"] }]);
  });
});

describe("parser meta type no cookie jar", function () {
  it("with", function () {
    const exprs = parser("# @no-cookie-jar\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar"] }]);
  });

  it("with     ", function () {
    const exprs = parser("# @no-cookie-jar     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# @no-cookie-jar aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# @no-cookie-jar aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   @no-cookie-jar   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa  description info"] }]);
  });

  it("with a b", function () {
    const exprs = parser("# @no-cookie-jar a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "a"] }]);
  });

  it("// with", function () {
    const exprs = parser("// @no-cookie-jar\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   @no-cookie-jar   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "aa  description info"] }]);
  });

  it("// with a", function () {
    const exprs = parser("// @no-cookie-jar a\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@no-cookie-jar", "a"] }]);
  });
});

describe("parser meta type comment", function () {
  it("with#", function () {
    const exprs = parser("##\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", "#"] }]);
  });

  it("with #", function () {
    const exprs = parser("# #\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "#"] }]);
  });

  it("with", function () {
    const exprs = parser("#\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment"] }]);
  });

  it("with @names", function () {
    const exprs = parser("# @names\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "@names"] }]);
  });

  it("with     ", function () {
    const exprs = parser("#     \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment"] }]);
  });

  it("with aa", function () {
    const exprs = parser("# aa\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "aa"] }]);
  });

  it("with aa description info", function () {
    const exprs = parser("# aa description info\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "aa description info"] }]);
  });

  it("with   aa  description info ", function () {
    const exprs = parser("#   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "aa  description info"] }]);
  });

  it("// with/", function () {
    const exprs = parser("///\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", "/"] }]);
  });

  it("// with//", function () {
    const exprs = parser("////\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", "//"] }]);
  });

  it("// with //", function () {
    const exprs = parser("// //\n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "//"] }]);
  });

  it("// with   aa  description info ", function () {
    const exprs = parser("//   aa  description info \n", true);
    expect(exprs).toEqual([{ type: "meta", value: ["@comment", " ", "aa  description info"] }]);
  });
});

describe("parser var type", function () {
  it("@", function () {
    const exprs = parser("@\n", true);
    expect(exprs).toHaveProperty("[0].error.code", "S040001");
    delete exprs[0].error;
    expect(exprs).toEqual([{ type: "var", value: [] }]);
  });

  it("@a=", function () {
    const exprs = parser("@a=\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", ""] }]);
  });

  it("@a=b", function () {
    const exprs = parser("@a=b\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", "b"] }]);
  });

  it("@a =b", function () {
    const exprs = parser("@a =b\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", "b"] }]);
  });

  it("@a= b", function () {
    const exprs = parser("@a= b\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", "b"] }]);
  });

  it("@a = b", function () {
    const exprs = parser("@a = b\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", "b"] }]);
  });

  it("@a e = b c d", function () {
    const exprs = parser("@a e = b c d\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a e", "b c d"] }]);
  });

  it("@a = b c d", function () {
    const exprs = parser("@a = b c d\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["a", "b c d"] }]);
  });

  it("@hostname = api.example.com", function () {
    const exprs = parser("@hostname = api.example.com\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["hostname", "api.example.com"] }]);
  });

  it("@port = 8080", function () {
    const exprs = parser("@port = 8080\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["port", "8080"] }]);
  });

  it("@host = {{hostname}}:{{port}}", function () {
    const exprs = parser("@host = {{hostname}}:{{port}}\n", true);
    expect(exprs).toEqual([
      { type: "var", value: ["host", "{{hostname}}:{{port}}", ["{{hostname}}", "hostname", "{{port}}", "port"]] },
    ]);
  });

  it("@signleQuoted = '  dsdaf  '", function () {
    const exprs = parser("@signleQuoted = '  dsdaf  '\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["signleQuoted", "'  dsdaf  '"] }]);
  });

  it("@signleQuoted = '  ds\\ndaf  '", function () {
    const exprs = parser("@signleQuoted = '  ds\\ndaf  '\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["signleQuoted", "'  ds\\ndaf  '"] }]);
  });

  it('@doubleQuoted = "  dsdaf  "', function () {
    const exprs = parser('@signleQuoted = "  dsdaf  "\n', true);
    expect(exprs).toEqual([{ type: "var", value: ["signleQuoted", '"  dsdaf  "'] }]);
  });

  it('@signleQuoted = "  ds\\ndaf  "', function () {
    const exprs = parser('@signleQuoted = "  ds\\ndaf  "\n', true);
    expect(exprs).toEqual([{ type: "var", value: ["signleQuoted", '"  ds\\ndaf  "'] }]);
  });

  it("@contentType = application/json", function () {
    const exprs = parser("@contentType = application/json\n", true);
    expect(exprs).toEqual([{ type: "var", value: ["contentType", "application/json"] }]);
  });

  it("@createdAt = {{$datetime iso8601}}", function () {
    const exprs = parser("@createdAt = {{$datetime iso8601}}\n", true);
    expect(exprs).toEqual([
      { type: "var", value: ["createdAt", "{{$datetime iso8601}}", ["{{$datetime iso8601}}", "$datetime iso8601"]] },
    ]);
  });

  it("@modifiedBy = {{$processEnv USERNAME}}", function () {
    const exprs = parser("@modifiedBy = {{$processEnv USERNAME}}\n", true);
    expect(exprs).toEqual([
      {
        type: "var",
        value: ["modifiedBy", "{{$processEnv USERNAME}}", ["{{$processEnv USERNAME}}", "$processEnv USERNAME"]],
      },
    ]);
  });
});

describe("parser url type", function () {
  it("example", function () {
    const exprs = parser("example\n", true);
    expect(exprs).toEqual([{ type: "url", value: ["GET", "example"] }]);
  });

  it("example.com/", function () {
    const exprs = parser("example.com/\n", true);
    expect(exprs).toEqual([{ type: "url", value: ["GET", "example.com/"] }]);
  });

  it("http://example.com?q=a", function () {
    const exprs = parser("http://example.com?q=a\n", true);
    expect(exprs).toEqual([{ type: "url", value: ["GET", "http://example.com?q=a"] }]);
  });

  it("POST http://example.com HTTP/1.1", function () {
    const exprs = parser("POST http://example.com HTTP/1.1\n", true);
    expect(exprs).toEqual([{ type: "url", value: ["POST", "http://example.com", "HTTP/1.1"] }]);
  });

  it("http://example.com\n?q=a", function () {
    const exprs = parser("http://example.com\n?q=a\n", true);
    expect(exprs).toEqual([
      { type: "url", value: ["GET", "http://example.com"] },
      { type: "url", value: ["?q=a"] },
    ]);
  });

  it("http://example.com\n?q=a\n&p=b", function () {
    const exprs = parser("http://example.com\n?q=a\n&p=b\n", true);
    expect(exprs).toEqual([
      { type: "url", value: ["GET", "http://example.com"] },
      { type: "url", value: ["?q=a"] },
      { type: "url", value: ["&p=b"] },
    ]);
  });
});

describe("parser header type", function () {
  it("POST http://example.com HTTP/1.1\nUser-Agent\n", function () {
    const exprs = parser("POST http://example.com HTTP/1.1\nUser-Agent\n", true);
    expect(exprs).toHaveProperty("[1].error.code", "S070001");
    delete exprs[1].error;
    expect(exprs).toEqual([
      { type: "url", value: ["POST", "http://example.com", "HTTP/1.1"] },
      { type: "header", value: ["User-Agent"] },
    ]);
  });

  it("POST http://example.com HTTP/1.1\nUser-Agent:restclient\n", function () {
    const exprs = parser("POST http://example.com HTTP/1.1\nUser-Agent:restclient\n", true);
    expect(exprs).toEqual([
      { type: "url", value: ["POST", "http://example.com", "HTTP/1.1"] },
      { type: "header", value: ["User-Agent", "restclient"] },
    ]);
  });
});

describe("parser body type", function () {
  it("POST http://example.com HTTP/1.1\n     \n", function () {
    const exprs = parser("POST http://example.com HTTP/1.1\n     \n", true);
    expect(exprs).toEqual([
      { type: "url", value: ["POST", "http://example.com", "HTTP/1.1"] },
      { type: "body", value: null },
    ]);
  });

  it("POST http://example.com HTTP/1.1\nUser-Agent:restclient\n\nHELLO WORLD", function () {
    const exprs = parser("POST http://example.com HTTP/1.1\nUser-Agent:restclient\n\nHELLO WORLD", true);
    expect(exprs).toEqual([
      { type: "url", value: ["POST", "http://example.com", "HTTP/1.1"] },
      { type: "header", value: ["User-Agent", "restclient"] },
      { type: "body", value: null },
      { type: "body", value: ["HELLO WORLD"] },
    ]);
  });
});
