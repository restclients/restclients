const { describe, expect, it } = require("@jest/globals");
const { isValidUrl, datetimeAdd, datetimeFormat, resolveFilePath, parseContentType, ContentType, getHeader } = require("./util");

describe("isValidUrl", function () {
  it("example.com", function () {
    const valid = isValidUrl("example.com");
    expect(valid).toEqual(false);
  });
});

describe("datetimeFormat", function () {
  it("local rfc1123", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    let expr = datetimeFormat(date, "", "ddd, DD MMM YYYY HH:mm:ss ZZ");
    expect(expr).toEqual("Sun, 30 Jun 2024 12:09:33 +0800");
  });

  it("local iso8601", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    let expr = datetimeFormat(date, "", "");
    expect(expr).toEqual("2024-06-30T12:09:33+08:00");
  });

  it("local YYYY-MM-DDTHH:mm:ssZ", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    let expr = datetimeFormat(date, "", "YYYY-MM-DDTHH:mm:ssZ");
    expect(expr).toEqual("2024-06-30T12:09:33+08:00");
  });

  it("UTC rfc1123", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    let expr = datetimeFormat(date, "UTC", "ddd, DD MMM YYYY HH:mm:ss [GMT]");
    expect(expr).toEqual("Sun, 30 Jun 2024 04:09:33 GMT");
  });

  it("UTC iso8601", function () {
    let date = new Date("2024-06-30T12:09:33.853+08:00");
    let expr = datetimeFormat(date, "UTC", "YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    expect(expr).toEqual("2024-06-30T04:09:33.853Z");
  });

  it("UTC YYYY-MM-DDTHH:mm:ssZ", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    let expr = datetimeFormat(date, "UTC", "YYYY-MM-DDTHH:mm:ssZ");
    expect(expr).toEqual("2024-06-30T04:09:33+00:00");
  });
});

describe("datetimeAdd", function () {
  it("add 2 y", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "y");
    expect(date).toEqual(new Date("2026-06-30T12:09:33+08:00"));
  });

  it("add 2 M", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "M");
    expect(date).toEqual(new Date("2024-08-30T12:09:33+08:00"));
  });

  it("add 2 w", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "w");
    expect(date).toEqual(new Date("2024-07-14T12:09:33+08:00"));
  });

  it("add 2 d", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "d");
    expect(date).toEqual(new Date("2024-07-02T12:09:33+08:00"));
  });

  it("add 2 h", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "h");
    expect(date).toEqual(new Date("2024-06-30T14:09:33+08:00"));
  });

  it("add 2 m", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "m");
    expect(date).toEqual(new Date("2024-06-30T12:11:33+08:00"));
  });

  it("add 2 s", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "s");
    expect(date).toEqual(new Date("2024-06-30T12:09:35+08:00"));
  });

  it("add 2 ms", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, 2, "ms");
    expect(date).toEqual(new Date("2024-06-30T12:09:33.002+08:00"));
  });

  it("add -2 y", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "y");
    expect(date).toEqual(new Date("2022-06-30T12:09:33+08:00"));
  });

  it("add -2 M", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "M");
    expect(date).toEqual(new Date("2024-04-30T12:09:33+08:00"));
  });

  it("add -2 w", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "w");
    expect(date).toEqual(new Date("2024-06-16T12:09:33+08:00"));
  });

  it("add -2 d", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "d");
    expect(date).toEqual(new Date("2024-06-28T12:09:33+08:00"));
  });

  it("add -2 h", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "h");
    expect(date).toEqual(new Date("2024-06-30T10:09:33+08:00"));
  });

  it("add -2 m", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "m");
    expect(date).toEqual(new Date("2024-06-30T12:07:33+08:00"));
  });

  it("add -2 s", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "s");
    expect(date).toEqual(new Date("2024-06-30T12:09:31+08:00"));
  });

  it("add -2 ms", function () {
    let date = new Date("2024-06-30T12:09:33+08:00");
    datetimeAdd(date, -2, "ms");
    expect(date).toEqual(new Date("2024-06-30T12:09:32.998+08:00"));
  });
});

describe("resolveFilePath", function () {
  it("absolute path exist", function () {
    expect(resolveFilePath("/", null, null)).toEqual("/");
  });

  it("absolute path not exist", function () {
    expect(resolveFilePath("/tttt.t", null, null)).toBeUndefined();
  });

  it("relative path exist under rootDir", function () {
    expect(resolveFilePath("./src/util.test.js", process.cwd(), null)).toBeDefined();
  });

  it("relative path not exist under rootDir", function () {
    expect(resolveFilePath("./src/notExistUtil.test.js", process.cwd(), null)).toBeUndefined();
  });

  it("relative path exist with current file", function () {
    expect(resolveFilePath("./util.test.js", process.cwd(), __filename)).toBeDefined();
  });

  it("relative path not exist with current file", function () {
    expect(resolveFilePath("./notExistUtil.test.js", process.cwd(), __filename)).toBeUndefined();
  });
});

describe("parseContentType", function () {
  it("application/json", function () {
    const contentType = parseContentType("application/json");
    expect(contentType).toEqual([ContentType.JsonType, "application/json", "application", "json"]);
  });
  it("application/json; charset=utf-8", function () {
    const contentType = parseContentType("application/json; charset=utf-8");
    expect(contentType).toEqual([ContentType.JsonType, "application/json", "application", "json"]);
  });
  it("application/xml", function () {
    const contentType = parseContentType("application/xml");
    expect(contentType).toEqual([ContentType.XmlType, "application/xml", "application", "xml"]);
  });
  it("text/html", function () {
    const contentType = parseContentType("text/html");
    expect(contentType).toEqual([ContentType.HtmlType, "text/html", "text", "html"]);
  });
  it("application/javascript", function () {
    const contentType = parseContentType("application/javascript");
    expect(contentType).toEqual([ContentType.JavascriptType, "application/javascript", "application", "javascript"]);
  });
  it("text/css", function () {
    const contentType = parseContentType("text/css");
    expect(contentType).toEqual([ContentType.CssType, "text/css", "text", "css"]);
  });
  it("multipart/mixed", function () {
    const contentType = parseContentType("multipart/mixed");
    expect(contentType).toEqual([ContentType.MultipartMixedType, "multipart/mixed", "multipart", "mixed"]);
  });
  it("multipart/form-data", function () {
    const contentType = parseContentType("multipart/form-data");
    expect(contentType).toEqual([ContentType.MultipartFormDataType, "multipart/form-data", "multipart", "form-data"]);
  });
  it("application/x-www-form-urlencoded", function () {
    const contentType = parseContentType("application/x-www-form-urlencoded");
    expect(contentType).toEqual([
      ContentType.FormUrlencodedType,
      "application/x-www-form-urlencoded",
      "application",
      "x-www-form-urlencoded",
    ]);
  });
  it("application/x-ndjson", function () {
    const contentType = parseContentType("application/x-ndjson");
    expect(contentType).toEqual([
      ContentType.NewlineDelimitedJsonType,
      "application/x-ndjson",
      "application",
      "x-ndjson",
    ]);
  });

  it("image/png", function () {
    const contentType = parseContentType("image/png");
    expect(contentType).toEqual([ContentType.UnknownType, "image/png", "image", "png"]);
  });
});

describe("getHeader", function () {
  it("content-type found", function () {
    const header = getHeader({"content-type": "application/json"}, "content-type");
    expect(header).toEqual("application/json");
  });

  it("Content-Type found", function () {
    const header = getHeader({"Content-Type": "application/json"}, "content-type");
    expect(header).toEqual("application/json");
  });

  it("Content-Type not found", function () {
    const header = getHeader({"Content-Type": "application/json"}, "contenttype");
    expect(header).toBeUndefined();
  });
});