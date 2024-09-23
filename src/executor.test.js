const readlinePromise = require("node:readline/promises");
const { describe, expect, it } = require("@jest/globals");
const { executor } = require("./executor");

/*
  it("GET https://jsonplaceholder.typicode.com/posts/1", async function () {
    const res = await executor({
      url: "https://jsonplaceholder.typicode.com/posts/1",
    });
    expect(res.status).toEqual(200);
  });
  */

describe("executor", function () {
  beforeAll(() => {
    const mockedDate = new Date("2024-06-30T12:09:33+08:00");
    jest.spyOn(global, "Date").mockImplementation(() => mockedDate);
    jest.spyOn(readlinePromise, "createInterface").mockImplementationOnce(() => {
      let i = 0;
      return {
        question: jest.fn().mockImplementation(() => {
          return "stdin" + ++i;
        }),
        close: jest.fn(),
      };
    });
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it("load example", async function () {
    const httpClient = jest.fn();
    const res = await executor({
      rootDir: "./example",
      httpClient,
    });
    expect(res[0][0].name).toEqual("");
    expect(res[0][0].range).toEqual([7, 17]);
    expect(res[0][0].url).toEqual("https://test.example.com:8633/users/stdin1");
    expect(res[0][0].header).toEqual({ "Content-Type": "application/json" });
    expect(res[0][0].body).toEqual('{    "email": "stdin2",    "password": "stdin3"}');
    expect(httpClient).toHaveBeenCalledWith("https://test.example.com:8633/users/stdin1", {
      method: "POST",
      body: '{    "email": "stdin2",    "password": "stdin3"}',
      headers: { "Content-Type": "application/json" },
    });
  });
});
