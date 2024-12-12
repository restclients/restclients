const readlinePromise = require("node:readline/promises");
const { join } = require("path");
const { describe, expect, it, beforeEach, afterAll } = require("@jest/globals");
const { evaluator } = require("./evaluator");
const { variable } = require("./variable");

describe("evaluator", function () {
  beforeEach(() => {
    const mockedDate = new Date("2024-06-30T12:09:33+08:00");
    jest.spyOn(global, "Date").mockImplementation(() => mockedDate);
    jest.spyOn(readlinePromise, "createInterface").mockImplementationOnce(() => {
      return {
        question: jest.fn().mockImplementation(() => {
          return "stdin";
        }),
        close: jest.fn(),
      };
    });
  });
  afterAll(() => {
    jest.clearAllMocks();
  });
  it("header url body", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "var",
        value: ["c", "{{a}}  ccdd {{b}}", ["{{a}}", ["a"], "{{b}}", ["b"]]],
      },
      {
        type: "var",
        value: ["d", "{{b}}  {{ intKey1 }}", ["{{b}}", ["b"], "{{ intKey1 }}", ["intKey1"]]],
      },
      {
        type: "var",
        value: ["e", "{{d}}  {{ $timestamp }}", ["{{d}}", ["d"], "{{ $timestamp }}", ["$timestamp"]]],
      },
      {
        type: "var",
        value: [
          "f",
          "{{e}}  {{ $randomInt 10 10 }}",
          ["{{e}}", ["e"], "{{ $randomInt 10 10 }}", ["$randomInt", "10", "10"]],
        ],
      },
      { type: "meta", value: ["@prompt", "aa", "description info"] },
      {
        type: "url",
        value: ["POST", "http://{{a}}example.com{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
      { type: "body", value: ["HELLO WORLD {{f}}", ["{{f}}", ["f"]]] },
    ];
    const vars = variable(exprs);
    vars.setEnvironmentVariable({
      $shared: {
        key1: "KEYYYY",
        key2: "sfasfd",
        key3: 12,
        key4: "ddff {{$shared key3 }}",
        key5: "ddff {{  $shared key3 }}",
        key6: "ddff {{$shared key7}}",
      },
      int: {
        intKey1: "INT KEY 1",
        intKey2: 3,
        intKey3: "INT REFER SHARED {{ $shared key4}}",
        intKey4: "INT REFER INT {{ $int intKey2 }}",
        intKey5: "INT REFER INT {{ $int intKey2 }} {{ $int intKey1 }}",
        intKey6: "INT REFER SHARED {{ $shared key4}} INT REFER INT {{ $int intKey2 }}",
      },
    });
    vars.selectEnvironment("int");
    const req = await evaluator(exprs, vars);
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http:// cccc example.comstdin?q=cccc&p= cccc   ccdd cccc");
    expect(req.header).toEqual({ "User-Agent": "restclient cccc  INT KEY 1  1719720573" });
    expect(req.body).toEqual(Buffer.from("HELLO WORLD cccc  INT KEY 1  1719720573  10"));
  });

  it("header url body with http host", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "var",
        value: ["c", "{{a}}  ccdd {{b}}", ["{{a}}", ["a"], "{{b}}", ["b"]]],
      },
      {
        type: "var",
        value: ["d", "{{b}}  {{ intKey1 }}", ["{{b}}", ["b"], "{{ intKey1 }}", ["intKey1"]]],
      },
      {
        type: "var",
        value: ["e", "{{d}}  {{ $timestamp }}", ["{{d}}", ["d"], "{{ $timestamp }}", ["$timestamp"]]],
      },
      {
        type: "var",
        value: [
          "f",
          "{{e}}  {{ $randomInt 10 10 }}",
          ["{{e}}", ["e"], "{{ $randomInt 10 10 }}", ["$randomInt", "10", "10"]],
        ],
      },
      { type: "meta", value: ["@prompt", "aa", "description info"] },
      {
        type: "url",
        value: ["POST", "/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      {
        type: "header",
        value: ["Host", "example.com"],
      },
      { type: "body", value: null },
      { type: "body", value: ["HELLO WORLD {{f}}", ["{{f}}", ["f"]]] },
    ];
    const vars = variable(exprs);
    vars.setEnvironmentVariable({
      $shared: {
        key1: "KEYYYY",
        key2: "sfasfd",
        key3: 12,
        key4: "ddff {{$shared key3 }}",
        key5: "ddff {{  $shared key3 }}",
        key6: "ddff {{$shared key7}}",
      },
      int: {
        intKey1: "INT KEY 1",
        intKey2: 3,
        intKey3: "INT REFER SHARED {{ $shared key4}}",
        intKey4: "INT REFER INT {{ $int intKey2 }}",
        intKey5: "INT REFER INT {{ $int intKey2 }} {{ $int intKey1 }}",
        intKey6: "INT REFER SHARED {{ $shared key4}} INT REFER INT {{ $int intKey2 }}",
      },
    });
    vars.selectEnvironment("int");
    const req = await evaluator(exprs, vars);
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /stdin?q=cccc&p= cccc   ccdd cccc");
    expect(req.header).toEqual({ "User-Agent": "restclient cccc  INT KEY 1  1719720573", Host: "example.com" });
    expect(req.body).toEqual(Buffer.from("HELLO WORLD cccc  INT KEY 1  1719720573  10"));
  });

  it("header url body with file body", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
      { type: "body", value: ["< ./sample.txt", []] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, { rootDir: join(__dirname, "../example"), currentFilePath: __filename });
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({ "User-Agent": "restclient {{e}}" });
    expect(req.body).toEqual(Buffer.from("This is a line\nThis is a line with variable {{ a }}"));
  });

  it("header url body with script", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      { type: "meta", value: ["@script", "./basic.js"] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, { rootDir: join(__dirname, "../example"), currentFilePath: __filename });
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({ "User-Agent": "restclient {{e}}" });
    expect(req.scriptContent.toString()).toContain('  logging.info("script start");');
  });

  it("header url body with file body not found", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
      { type: "body", value: ["< ./sample.txt", []] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, {});
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({ "User-Agent": "restclient {{e}}" });
    expect(req.body).toEqual(Buffer.from("< ./sample.txt"));
  });

  it("header url body with file body resolve variable", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
      { type: "body", value: ["<@ ./sample.txt", []] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, { rootDir: join(__dirname, "../example"), currentFilePath: __filename });
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({ "User-Agent": "restclient {{e}}" });
    expect(req.body).toEqual(Buffer.from("This is a line\nThis is a line with variable  cccc "));
  });

  it("header url body with base64 encoding file body resolve variable", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "body", value: null },
      { type: "body", value: ["<@utf16le ./sample.utf16le.txt", []] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, { rootDir: join(__dirname, "../example"), currentFilePath: __filename });
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({ "User-Agent": "restclient {{e}}" });
    // skip UTF16 BOM header
    expect(req.body.slice(3)).toEqual(Buffer.from("This is a line\nThis is a line with variable  cccc "));
  });

  it("header url body with url encode body", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/test/{{a}}/{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      { type: "header", value: ["Content-Type", "application/x-www-form-urlencoded"] },
      { type: "body", value: null },
      { type: "body", value: ["name=foo", []] },
      { type: "body", value: ["&password={{a}}", ["{{a}}", ["a"]]] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, {});
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/test/ cccc /{{aa}}?q=cccc&p={{c}}");
    expect(req.header).toEqual({
      "User-Agent": "restclient {{e}}",
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(req.body).toEqual("name=foo&password=+cccc+");
  });

  it("header url body with multipart form data body", async () => {
    const exprs = [
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      {
        type: "url",
        value: ["POST", "http://example.com/upload", []],
      },
      { type: "url", value: ["?q={{b}}", ["{{b}}", ["b"]]] },
      { type: "url", value: ["&p={{c}}", ["{{c}}", ["c"]]] },
      {
        type: "header",
        value: ["User-Agent", "restclient {{e}}", ["{{e}}", ["e"]]],
      },
      {
        type: "header",
        value: ["Content-Type", "multipart/form-data; boundary=----WebKitFormBoundaryM6cFocZWsx5Brf1A"],
      },
      { type: "body", value: null },
      { type: "body", value: ["------WebKitFormBoundaryM6cFocZWsx5Brf1A"] },
      { type: "body", value: ['Content-Disposition: form-data; name="form"'] },
      { type: "body", value: null },
      { type: "body", value: ["test data"] },
      { type: "body", value: ["------WebKitFormBoundaryM6cFocZWsx5Brf1A"] },
      { type: "body", value: ['Content-Disposition: form-data; name="file"; filename="sample.txt"'] },
      { type: "body", value: ["Content-Type: application/octet-stream"] },
      { type: "body", value: null },
      { type: "body", value: null },
      { type: "body", value: ["< ./sample.txt", []] },
      { type: "body", value: ["------WebKitFormBoundaryM6cFocZWsx5Brf1A--"] },
    ];
    const vars = variable(exprs);
    const req = await evaluator(exprs, vars, { rootDir: join(__dirname, "../example"), currentFilePath: __filename });
    expect(req.method).toEqual("POST");
    expect(req.url).toEqual("http://example.com/upload?q=cccc&p={{c}}");
    expect(req.header).toEqual({
      "User-Agent": "restclient {{e}}",
      "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryM6cFocZWsx5Brf1A",
    });
    expect(req.body).toEqual(
      Buffer.from(
        '------WebKitFormBoundaryM6cFocZWsx5Brf1A\r\nContent-Disposition: form-data; name="form"\r\n\r\ntest data\r\n------WebKitFormBoundaryM6cFocZWsx5Brf1A\r\nContent-Disposition: form-data; name="file"; filename="sample.txt"\r\nContent-Type: application/octet-stream\r\n\r\n\r\nThis is a line\nThis is a line with variable {{ a }}\r\n------WebKitFormBoundaryM6cFocZWsx5Brf1A--'
      )
    );
  });
});
