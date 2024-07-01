const { describe, expect, it } = require("@jest/globals");
const { isValidUrl, datetimeAdd, datetimeFormat } = require("./util");

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
