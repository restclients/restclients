const { existsSync, readFileSync } = require("fs");
const path = require("path");
const { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } = require("@jest/globals");
const { variable } = require("./variable");
const {
  resolveEnvironmentVariable,
  resolveDynamicVariable,
  setEnvironmentVariable,
  selectEnvironment,
  resetDotenvVariable,
  setDotenvVariable,
} = variable([]);

describe("resolver.resolveDynamicVariable", function () {
  describe("guid", function () {
    it("$guid", function () {
      const res = resolveDynamicVariable(["$guid"]);
      expect(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi.test(res.value)
      ).toEqual(true);
    });
  });

  describe("datetime", function () {
    let spy;

    beforeEach(() => {
      const mockedDate = new Date("2024-06-30T12:09:33+08:00");
      spy = jest.spyOn(global, "Date").mockImplementation(() => mockedDate);
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("$timestamp", function () {
      const res = resolveDynamicVariable(["$timestamp"]);
      expect(res.value).toEqual("1719720573");
    });

    it("$timestamp -1 m", function () {
      const res = resolveDynamicVariable(["$timestamp", "-1", "m"]);
      expect(res.value).toEqual("1719720513");
    });

    it("$localDatetime iso8601", function () {
      const res = resolveDynamicVariable(["$localDatetime"]);
      expect(res.value).toEqual("2024-06-30T12:09:33+08:00");
    });

    it("$localDatetime rfc1123", function () {
      const res = resolveDynamicVariable(["$localDatetime", "rfc1123"]);
      expect(res.value).toEqual("Sun, 30 Jun 2024 12:09:33 +0800");
    });

    it("$localDatetime iso8601 2 d", function () {
      const res = resolveDynamicVariable(["$localDatetime", "iso8601", "2", "d"]);
      expect(res.value).toEqual("2024-07-02T12:09:33+08:00");
    });

    it("$localDatetime iso8601 -2 d", function () {
      const res = resolveDynamicVariable(["$localDatetime", "iso8601", "-2", "d"]);
      expect(res.value).toEqual("2024-06-28T12:09:33+08:00");
    });

    it("$localDatetime YYYY-MM-DDTHH:mm:ssZ", function () {
      const res = resolveDynamicVariable(["$localDatetime", "YYYY-MM-DDTHH:mm:ssZ"]);
      expect(res.value).toEqual("2024-06-30T12:09:33+08:00");
    });

    it("$datetime iso8601", function () {
      const res = resolveDynamicVariable(["$datetime"]);
      expect(res.value).toEqual("2024-06-30T04:09:33+00:00");
    });

    it("$datetime rfc1123", function () {
      const res = resolveDynamicVariable(["$datetime", "rfc1123"]);
      expect(res.value).toEqual("Sun, 30 Jun 2024 04:09:33 GMT");
    });

    it("$datetime iso8601 2 d", function () {
      const res = resolveDynamicVariable(["$datetime", "iso8601", "2", "d"]);
      expect(res.value).toEqual("2024-07-02T04:09:33.000Z");
    });

    it("$datetime iso8601 -2 d", function () {
      const res = resolveDynamicVariable(["$datetime", "iso8601", "-2", "d"]);
      expect(res.value).toEqual("2024-06-28T04:09:33.000Z");
    });

    it("$datetime YYYY-MM-DDTHH:mm:ssZ", function () {
      const res = resolveDynamicVariable(["$datetime", "YYYY-MM-DDTHH:mm:ssZ"]);
      expect(res.value).toEqual("2024-06-30T04:09:33+00:00");
    });
  });

  describe("processEnv", function () {
    let oldProcessEnv = process.env;
    beforeAll(() => {
      process.env = {};
      process.env["a"] = "123";
      process.env["b"] = "sdfjksfkasfkals";
      process.env["c"] = "dd\nsss";
      process.env["d"] = " ss\\ndksdkk  ";
      process.env["e"] = "ddd\ndafd\n\ndfdf\n\n\nf";
      process.env["f"] = '"aaa"';
      process.env["KEYYYY"] = "FROM SHARED KEY";
      process.env["INTKEY"] = "FROM INT KEY";
    });
    afterAll(() => {
      process.env = oldProcessEnv;
    });
    describe("basic", function () {
      it("$processEnv a", function () {
        const res = resolveDynamicVariable(["$processEnv", "a"]);
        expect(res.value).toEqual("123");
      });

      it("$processEnv b", function () {
        const res = resolveDynamicVariable(["$processEnv", "b"]);
        expect(res.value).toEqual("sdfjksfkasfkals");
      });

      it("$processEnv c", function () {
        const res = resolveDynamicVariable(["$processEnv", "c"]);
        expect(res.value).toEqual("dd\nsss");
      });

      it("$processEnv d", function () {
        const res = resolveDynamicVariable(["$processEnv", "d"]);
        expect(res.value).toEqual(" ss\\ndksdkk  ");
      });

      it("$processEnv e", function () {
        const res = resolveDynamicVariable(["$processEnv", "e"]);
        expect(res.value).toEqual("ddd\ndafd\n\ndfdf\n\n\nf");
      });

      it("$processEnv f", function () {
        const res = resolveDynamicVariable(["$processEnv", "f"]);
        expect(res.value).toEqual('"aaa"');
      });
    });

    describe("reference", function () {
      beforeAll(() => {
        setEnvironmentVariable({
          $shared: {
            key1: "KEYYYY",
          },
          int: {
            intKey1: "INTKEY",
          },
        });
        selectEnvironment("int");
      });
      it("$processEnv %key1", function () {
        const res = resolveDynamicVariable(["$processEnv", "%key1"]);
        expect(res.value).toEqual("FROM SHARED KEY");
      });

      it("$processEnv %intKey1", function () {
        const res = resolveDynamicVariable(["$processEnv", "%intKey1"]);
        expect(res.value).toEqual("FROM INT KEY");
      });
    });
  });

  describe("dotenv", function () {
    beforeAll(() => {
      const dotenvFile = path.join(__dirname, "..", ".test.env");
      if (existsSync(dotenvFile)) {
        resetDotenvVariable();
        const src = readFileSync(dotenvFile);
        setDotenvVariable(src);
      }
    });
    describe("basic", function () {
      it("$dotenv a", function () {
        const res = resolveDynamicVariable(["$dotenv", "a"]);
        expect(res.value).toEqual("123");
      });

      it("$dotenv b", function () {
        const res = resolveDynamicVariable(["$dotenv", "b"]);
        expect(res.value).toEqual("sdfjksfkasfkals");
      });

      it("$dotenv c", function () {
        const res = resolveDynamicVariable(["$dotenv", "c"]);
        expect(res.value).toEqual("dd\nsss");
      });

      it("$dotenv d", function () {
        const res = resolveDynamicVariable(["$dotenv", "d"]);
        expect(res.value).toEqual(" ss\\ndksdkk  ");
      });

      it("$dotenv e", function () {
        const res = resolveDynamicVariable(["$dotenv", "e"]);
        expect(res.value).toEqual("ddd\ndafd\n\ndfdf\n\n\nf");
      });

      it("$dotenv f", function () {
        const res = resolveDynamicVariable(["$dotenv", "f"]);
        expect(res.value).toEqual("aaa");
      });
    });

    describe("reference", function () {
      beforeAll(() => {
        setEnvironmentVariable({
          $shared: {
            key1: "KEYYYY",
          },
          int: {
            intKey1: "INTKEY",
          },
        });
        selectEnvironment("int");
      });
      it("$dotenv %key1", function () {
        const res = resolveDynamicVariable(["$dotenv", "%key1"]);
        expect(res.value).toEqual("FROM SHARED KEY");
      });

      it("$dotenv %intKey1", function () {
        const res = resolveDynamicVariable(["$dotenv", "%intKey1"]);
        expect(res.value).toEqual("FROM INT KEY");
      });
    });
  });

  describe("randomInt", function () {
    it("$randomInt 10 100", function () {
      const res = resolveDynamicVariable(["$randomInt", "10", "100"]);
      expect(Number(res.value)).toBeLessThanOrEqual(100);
      expect(Number(res.value)).toBeGreaterThanOrEqual(10);
    });

    it("$randomInt 10 10", function () {
      const res = resolveDynamicVariable(["$randomInt", "10", "10"]);
      expect(res.value).toEqual("10");
    });
  });
});

describe("resolver.resolveEnvironmentVariable", function () {
  describe("shared", function () {
    beforeAll(() => {
      setEnvironmentVariable({
        $shared: {
          key1: "KEYYYY",
          key2: "sfasfd",
          key3: 12,
          key4: "ddff {{$shared key3 }}",
          key5: "ddff {{  $shared key3 }}",
          key6: "ddff {{ $shared key2}} ss {{$shared key3}}",
          key7: "ddff {{$shared key8}}",
        },
      });
    });
    it("key1", function () {
      const res = resolveEnvironmentVariable("key1");
      expect(res.value).toEqual("KEYYYY");
    });

    it("key2", function () {
      const res = resolveEnvironmentVariable("key2");
      expect(res.value).toEqual("sfasfd");
    });

    it("key3", function () {
      const res = resolveEnvironmentVariable("key3");
      expect(res.value).toEqual("12");
    });

    it("key4", function () {
      const res = resolveEnvironmentVariable("key4");
      expect(res.value).toEqual("ddff 12");
    });

    it("key5", function () {
      const res = resolveEnvironmentVariable("key5");
      expect(res.value).toEqual("ddff 12");
    });

    it("key6", function () {
      const res = resolveEnvironmentVariable("key6");
      expect(res.value).toEqual("ddff sfasfd ss 12");
    });

    it("key7", function () {
      const res = resolveEnvironmentVariable("key7");
      expect(res.value).toEqual("ddff undefined");
    });
  });

  describe("int", function () {
    beforeAll(() => {
      setEnvironmentVariable({
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
      selectEnvironment("int");
    });
    it("intKey1", function () {
      const res = resolveEnvironmentVariable("intKey1");
      expect(res.value).toEqual("INT KEY 1");
    });

    it("intKey2", function () {
      const res = resolveEnvironmentVariable("intKey2");
      expect(res.value).toEqual("3");
    });

    it("intKey3", function () {
      const res = resolveEnvironmentVariable("intKey3");
      expect(res.value).toEqual("INT REFER SHARED ddff 12");
    });

    it("intKey4", function () {
      const res = resolveEnvironmentVariable("intKey4");
      expect(res.value).toEqual("INT REFER INT 3");
    });

    it("intKey5", function () {
      const res = resolveEnvironmentVariable("intKey5");
      expect(res.value).toEqual("INT REFER INT 3 INT KEY 1");
    });

    it("intKey6", function () {
      const res = resolveEnvironmentVariable("intKey6");
      expect(res.value).toEqual("INT REFER SHARED ddff 12 INT REFER INT 3");
    });
  });
});

describe("resolver.resolveFileVariable", function () {
  const { resolveFileVariable, setEnvironmentVariable, selectEnvironment, resetDotenvVariable, setDotenvVariable } =
    variable([
      { type: "var", value: ["b", "cccc", []] },
      { type: "var", value: ["a", " {{b}} ", ["{{b}}", ["b"]]] },
      { type: "var", value: ["c", "{{a}}  ccdd {{b}}", ["{{a}}", ["a"], "{{b}}", ["b"]]] },
      { type: "var", value: ["d", "{{b}}  {{ intKey1 }}", ["{{b}}", ["b"], "{{ intKey1 }}", ["intKey1"]]] },
      { type: "var", value: ["e", "{{d}}  {{ $timestamp }}", ["{{d}}", ["d"], "{{ $timestamp }}", ["$timestamp"]]] },
      {
        type: "var",
        value: [
          "f",
          "{{e}}  {{ $randomInt 10 10 }}",
          ["{{e}}", ["e"], "{{ $randomInt 10 10 }}", ["$randomInt", "10", "10"]],
        ],
      },
    ]);
  let spy;
  beforeAll(() => {
    const dotenvFile = path.join(__dirname, "..", ".test.env");
    if (existsSync(dotenvFile)) {
      resetDotenvVariable();
      const src = readFileSync(dotenvFile);
      setDotenvVariable(src);
    }

    setEnvironmentVariable({
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
    selectEnvironment("int");

    process.env = {};
    process.env["PEDATA"] = "process env data";
    process.env["KEYYYY"] = "FROM SHARED KEY";
    process.env["INTKEY"] = "FROM INT KEY";

    const mockedDate = new Date("2024-06-30T12:09:33+08:00");
    spy = jest.spyOn(global, "Date").mockImplementation(() => mockedDate);
  });

  afterAll(() => {
    spy.mockRestore();
  });

  describe("only file variable", function () {
    it("with setting variable", function () {
      let variables = [
        {
          value: "http://{{a}}.{{ b}}.{{ c }} {{intKey3}}",
          args: ["{{a}}", ["a"], "{{ b}}", ["b"], "{{ c }}", ["c"], "{{intKey3}}", ["intKey3"]],
        },
        {
          value: "{{%a}} {{@a}}",
          args: ["{{%a}}", ["%a"], "{{@a}}", ["@a"]],
        },
        {
          value: "{{%key4}} {{@key4}}",
          args: ["{{%key4}}", ["%key4"], "{{@key4}}", ["@key4"]],
        },
        {
          value: "{{%key3}} {{@key3}}",
          args: ["{{%key3}}", ["%key3"], "{{@key3}}", ["@key3"]],
        },
        {
          value: "{{%intKey4}} {{@intKey4}}",
          args: ["{{%intKey4}}", ["%intKey4"], "{{@intKey4}}", ["@intKey4"]],
        },
      ];
      resolveFileVariable(variables);
      expect(variables[0].value).toEqual("http:// cccc .cccc. cccc   ccdd cccc INT REFER SHARED ddff 12");
      expect(variables[1].value).toEqual("%20cccc%20 IGNjY2Mg");
      expect(variables[2].value).toEqual("ddff%2012 ZGRmZiAxMg==");
      expect(variables[3].value).toEqual("12 MTI=");
      expect(variables[4].value).toEqual("INT%20REFER%20INT%203 SU5UIFJFRkVSIElOVCAz");
    });

    it("with setting variable 2", function () {
      let variables = [
        {
          value: "http://{{ b}}.{{ d }}.{{intKey2}}",
          args: ["{{ b}}", ["b"], "{{ d }}", ["d"], "{{intKey2}}", ["intKey2"]],
        },
      ];
      resolveFileVariable(variables);
      expect(variables[0].value).toEqual("http://cccc.cccc  INT KEY 1.3");
    });

    it("with $processEnv", function () {
      let variables = [
        { value: "http://{{a}}.{{ b}}.{{ c }}", args: ["{{a}}", ["a"], "{{ b}}", ["b"], "{{ c }}", ["c"]] },
        {
          value: "?q={{ $processEnv PEDATA}}&q1={{%a}}",
          args: ["{{ $processEnv PEDATA}}", ["$processEnv", "PEDATA"], "{{%a}}", ["%a"]],
        },
      ];
      resolveFileVariable(variables);
      expect(variables[0].value).toEqual("http:// cccc .cccc. cccc   ccdd cccc");
      expect(variables[1].value).toEqual("?q=process env data&q1=%20cccc%20");
    });

    it("with $dotenv $timestamp", function () {
      let variables = [
        { value: "http://{{a}}.{{ b}}.{{ c }}", args: ["{{a}}", ["a"], "{{ b}}", ["b"], "{{ c }}", ["c"]] },
        {
          value: "x-header: {{e}}, {{$dotenv %key1}}",
          args: ["{{e}}", ["e"], "{{$dotenv %key1}}", ["$dotenv", "%key1"]],
        },
      ];
      resolveFileVariable(variables);
      expect(variables[0].value).toEqual("http:// cccc .cccc. cccc   ccdd cccc");
      expect(variables[1].value).toEqual("x-header: cccc  INT KEY 1  1719720573, FROM SHARED KEY");
    });

    it("with $randomInt", function () {
      let variables = [
        { value: "http://{{a}}.{{ b}}.{{ c }}", args: ["{{a}}", ["a"], "{{ b}}", ["b"], "{{ c }}", ["c"]] },
        {
          value: "x-header: {{f}}",
          args: ["{{f}}", ["f"]],
        },
      ];
      resolveFileVariable(variables);
      expect(variables[0].value).toEqual("http:// cccc .cccc. cccc   ccdd cccc");
      expect(variables[1].value).toEqual("x-header: cccc  INT KEY 1  1719720573  10");
    });
  });
});
