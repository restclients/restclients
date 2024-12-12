const { EOL } = require("os");
const readlinePromise = require("node:readline/promises");
const { describe, expect, it, beforeEach, afterAll } = require("@jest/globals");
const { executor } = require("./executor");

describe("executor", function () {
  beforeEach(() => {
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

  it("execute example basic", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "basic",
      filePattern: ["./basic.rcs"],
    });
    const expectBody = Buffer.from(["{", '    "email": "stdin2",', '    "password": "stdin3"', "}"].join(EOL));
    expect(res[0][0].name).toEqual("basic");
    expect(res[0][0].range).toEqual([7, 18]);
    expect(res[0][0].url).toEqual("https://test.example.com:8633/users/stdin1");
    expect(res[0][0].header).toEqual({ "Content-Type": "application/json", "User-Agent": "restclients" });
    expect(res[0][0].body).toEqual(expectBody);
    expect(httpClient).toHaveBeenCalledWith("https://test.example.com:8633/users/stdin1", {
      method: "POST",
      body: expectBody,
      dispatcher: undefined,
      headers: { "Content-Type": "application/json", "User-Agent": "restclients" },
    });
  });

  it("execute example file body", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "file body",
    });
    const expectBody = Buffer.from("This is a line\nThis is a line with variable {{ a }}");
    expect(res[0][0].name).toEqual("file body");
    expect(res[0][0].range).toEqual([19, 24]);
    expect(res[0][0].url).toEqual("https://test.example.com:8633/users/file");
    expect(res[0][0].header).toEqual({ "Content-Type": "application/octet-stream", "User-Agent": "restclients" });
    expect(res[0][0].body).toEqual(expectBody);
    expect(httpClient).toHaveBeenCalledWith("https://test.example.com:8633/users/file", {
      method: "POST",
      body: expectBody,
      dispatcher: undefined,
      headers: { "Content-Type": "application/octet-stream", "User-Agent": "restclients" },
    });
  });

  it("execute example url encode body", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "url encode body",
    });
    const expectBody = "name=foo&password=data+111&option=id%26email";
    expect(res[0][0].name).toEqual("url encode body");
    expect(res[0][0].range).toEqual([25, 33]);
    expect(res[0][0].url).toEqual("https://test.example.com:8633/users/login");
    expect(res[0][0].header).toEqual({
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "restclients",
    });
    expect(res[0][0].body).toEqual(expectBody);
    expect(httpClient).toHaveBeenCalledWith("https://test.example.com:8633/users/login", {
      method: "POST",
      body: expectBody,
      dispatcher: undefined,
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "restclients" },
    });
  });

  it("execute example multipart form data body", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "multipart form data body",
    });
    const expectBody = Buffer.from(
      '------WebKitFormBoundaryM6cFocZWsx5Brf1A\r\nContent-Disposition: form-data; name="form"\r\n\r\ntest data\r\n------WebKitFormBoundaryM6cFocZWsx5Brf1A\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\nContent-Type: application/octet-stream\r\n\r\n\r\nThis is a line\nThis is a line with variable {{ a }}\r\n------WebKitFormBoundaryM6cFocZWsx5Brf1A--'
    );
    expect(res[0][0].name).toEqual("multipart form data body");
    expect(res[0][0].range).toEqual([34, 49]);
    expect(res[0][0].url).toEqual("https://test.example.com:8633/users/profile");
    expect(res[0][0].header).toEqual({
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryM6cFocZWsx5Brf1A",
      "User-Agent": "restclients",
    });
    expect(res[0][0].body).toEqual(expectBody);
    expect(httpClient).toHaveBeenCalledWith("https://test.example.com:8633/users/profile", {
      method: "POST",
      body: expectBody,
      dispatcher: undefined,
      headers: {
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryM6cFocZWsx5Brf1A",
        "User-Agent": "restclients",
      },
    });
  });

  it("execute example 'int' setting and dotenv config", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "setting and dotenv config",
      settingFile: "./example.config.js",
      environment: "int",
      dotenvFile: ".env",
    });

    expect(res[0][0].name).toEqual("setting and dotenv config");
    expect(res[0][0].range).toEqual([59, 62]);
    expect(res[0][0].url).toEqual("https://int.example.com/data");
    expect(res[0][0].header).toEqual({ Authorization: "Bearer intintint", "User-Agent": "myRestclients" });
    expect(res[0][0].body).toEqual(null);
    expect(httpClient).toHaveBeenCalledWith("https://int.example.com/data", {
      method: "GET",
      body: undefined,
      dispatcher: undefined,
      headers: { Authorization: "Bearer intintint", "User-Agent": "myRestclients" },
    });
  });

  it("execute example 'stage' setting and dotenv config", async function () {
    const httpClient = jest.fn().mockReturnValue(new Response());
    const res = await executor({
      rootDir: "./example",
      httpClient,
      namePattern: "setting and dotenv config",
      settingFile: "./example.config.js",
      environment: "stage",
      dotenvFile: ".env",
    });

    expect(res[0][0].name).toEqual("setting and dotenv config");
    expect(res[0][0].range).toEqual([59, 62]);
    expect(res[0][0].url).toEqual("https://stage.example.com/data");
    expect(res[0][0].header).toEqual({ Authorization: "Bearer stagestagestage", "User-Agent": "myRestclients" });
    expect(res[0][0].body).toEqual(null);
    expect(httpClient).toHaveBeenCalledWith("https://stage.example.com/data", {
      method: "GET",
      body: undefined,
      dispatcher: undefined,
      headers: { Authorization: "Bearer stagestagestage", "User-Agent": "myRestclients" },
    });
  });
});
