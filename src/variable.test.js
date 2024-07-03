const { describe, expect, it } = require("@jest/globals");
const { resolver, process } = require("./variable").variable();

describe("resolver", function () {
  it("$guid", function () {
    const res = resolver("$guid");
    expect(
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi.test(res.value)
    ).toEqual(true);
  });

  let spy;

  beforeEach(() => {
    const mockedDate = new Date("2024-06-30T12:09:33+08:00");
    spy = jest.spyOn(global, "Date").mockImplementation(() => mockedDate);
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it("$timestamp", function () {
    const res = resolver("$timestamp");
    expect(res.value).toEqual("1719720573");
  });

  it("$localDatetime iso8601", function () {
    const res = resolver("$localDatetime");
    expect(res.value).toEqual("2024-06-30T12:09:33+08:00");
  });

  it("$localDatetime rfc1123", function () {
    const res = resolver("$localDatetime rfc1123");
    expect(res.value).toEqual("Sun, 30 Jun 2024 12:09:33 +0800");
  });

  it("$localDatetime iso8601 2 d", function () {
    const res = resolver("$localDatetime iso8601 2 d");
    expect(res.value).toEqual("2024-07-02T12:09:33+08:00");
  });

  it("$localDatetime iso8601 -2 d", function () {
    const res = resolver("$localDatetime iso8601 -2 d");
    expect(res.value).toEqual("2024-06-28T12:09:33+08:00");
  });

  it("$localDatetime YYYY-MM-DDTHH:mm:ssZ", function () {
    const res = resolver("$localDatetime iso8601");
    expect(res.value).toEqual("2024-06-30T12:09:33+08:00");
  });

  it("$datetime iso8601", function () {
    const res = resolver("$datetime");
    expect(res.value).toEqual("2024-06-30T04:09:33+00:00");
  });

  it("$datetime rfc1123", function () {
    const res = resolver("$datetime rfc1123");
    expect(res.value).toEqual("Sun, 30 Jun 2024 04:09:33 GMT");
  });

  it("$datetime iso8601 2 d", function () {
    const res = resolver("$datetime iso8601 2 d");
    expect(res.value).toEqual("2024-07-02T04:09:33.000Z");
  });

  it("$datetime iso8601 -2 d", function () {
    const res = resolver("$datetime iso8601 -2 d");
    expect(res.value).toEqual("2024-06-28T04:09:33.000Z");
  });

  it("$datetime YYYY-MM-DDTHH:mm:ssZ", function () {
    const res = resolver("$datetime YYYY-MM-DDTHH:mm:ssZ");
    expect(res.value).toEqual("2024-06-30T04:09:33+00:00");
  });

  it("$randomInt 10 100", function () {
    const res = resolver("$randomInt 10 100");
    expect(Number(res.value)).toBeLessThanOrEqual(100);
    expect(Number(res.value)).toBeGreaterThanOrEqual(10);
  });

  it("$randomInt 10 10", function () {
    const res = resolver("$randomInt 10 10");
    expect(res.value).toEqual("10");
  });
});
