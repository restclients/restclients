const readlinePromise = require("node:readline/promises");
const { describe, expect, it, beforeAll, afterAll } = require("@jest/globals");
const { evaluator } = require("./evaluator");
const { variable } = require("./variable");

describe("evaluator", function () {
  beforeAll(() => {
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
        value: ["GET", "http://{{a}}example.com{{aa}}", ["{{a}}", ["a"], "{{aa}}", ["aa"]]],
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
    vars.setSettingVariable({
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
    vars.setSettingVariableSelection("int");
    const req = await evaluator(exprs, vars);
    expect(req.method).toEqual("GET");
    expect(req.url).toEqual("http:// cccc example.comstdin?q=cccc&p= cccc   ccdd cccc");
    expect(req.header).toEqual({ "User-Agent": "restclient cccc  INT KEY 1  1719720573" });
    expect(req.body).toEqual("HELLO WORLD cccc  INT KEY 1  1719720573  10");
  });
});
