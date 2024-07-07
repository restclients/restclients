const { existsSync, readFileSync } = require("fs");
const path = require("path");
const { describe, expect, it, beforeEach, afterEach, beforeAll, afterAll } = require("@jest/globals");
const { resolver, process, setSetting, setSelection, resetDotenv, setDotenv } = require("./variable").variable();

describe("resolver.resolveDynamicVariable", function () {
  describe("guid", function () {
    it("$guid", function () {
      const res = resolver("$guid");
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
        const res = resolver("$processEnv a");
        expect(res.value).toEqual("123");
      });

      it("$processEnv b", function () {
        const res = resolver("$processEnv b");
        expect(res.value).toEqual("sdfjksfkasfkals");
      });

      it("$processEnv c", function () {
        const res = resolver("$processEnv c");
        expect(res.value).toEqual("dd\nsss");
      });

      it("$processEnv d", function () {
        const res = resolver("$processEnv d");
        expect(res.value).toEqual(" ss\\ndksdkk  ");
      });

      it("$processEnv e", function () {
        const res = resolver("$processEnv e");
        expect(res.value).toEqual("ddd\ndafd\n\ndfdf\n\n\nf");
      });

      it("$processEnv f", function () {
        const res = resolver("$processEnv f");
        expect(res.value).toEqual("\"aaa\"");
      });
    });

    describe("reference", function () {
      beforeAll(() => {
        setSetting({
          $shared: {
            key1: "KEYYYY",
          },
          int: {
            intKey1: "INTKEY",
          },
        });
        setSelection("int");
      });
      it("$processEnv %key1", function () {
        const res = resolver("$processEnv %key1");
        expect(res.value).toEqual("FROM SHARED KEY");
      });

      it("$processEnv %intKey1", function () {
        const res = resolver("$processEnv %intKey1");
        expect(res.value).toEqual("FROM INT KEY");
      });
    });
  });

  describe("dotenv", function () {
    beforeAll(() => {
      const dotenvFile = path.join(__dirname, "..", ".test.env");
      if (existsSync(dotenvFile)) {
        resetDotenv();
        const src = readFileSync(dotenvFile);
        setDotenv(src);
      }
    });
    describe("basic", function () {
      it("$dotenv a", function () {
        const res = resolver("$dotenv a");
        expect(res.value).toEqual("123");
      });

      it("$dotenv b", function () {
        const res = resolver("$dotenv b");
        expect(res.value).toEqual("sdfjksfkasfkals");
      });

      it("$dotenv c", function () {
        const res = resolver("$dotenv c");
        expect(res.value).toEqual("dd\nsss");
      });

      it("$dotenv d", function () {
        const res = resolver("$dotenv d");
        expect(res.value).toEqual(" ss\\ndksdkk  ");
      });

      it("$dotenv e", function () {
        const res = resolver("$dotenv e");
        expect(res.value).toEqual("ddd\ndafd\n\ndfdf\n\n\nf");
      });

      it("$dotenv f", function () {
        const res = resolver("$dotenv f");
        expect(res.value).toEqual("aaa");
      });
    });

    describe("reference", function () {
      beforeAll(() => {
        setSetting({
          $shared: {
            key1: "KEYYYY",
          },
          int: {
            intKey1: "INTKEY",
          },
        });
        setSelection("int");
      });
      it("$dotenv %key1", function () {
        const res = resolver("$dotenv %key1");
        expect(res.value).toEqual("FROM SHARED KEY");
      });

      it("$dotenv %intKey1", function () {
        const res = resolver("$dotenv %intKey1");
        expect(res.value).toEqual("FROM INT KEY");
      });
    });
  });

  describe("randomInt", function () {
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
});

describe("resolver.resolveSettingVariable", function () {
  describe("shared", function () {
    beforeAll(() => {
      setSetting({
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
      const res = resolver("key1");
      expect(res.value).toEqual("KEYYYY");
    });

    it("key2", function () {
      const res = resolver("key2");
      expect(res.value).toEqual("sfasfd");
    });

    it("key3", function () {
      const res = resolver("key3");
      expect(res.value).toEqual("12");
    });

    it("key4", function () {
      const res = resolver("key4");
      expect(res.value).toEqual("ddff 12");
    });

    it("key5", function () {
      const res = resolver("key5");
      expect(res.value).toEqual("ddff 12");
    });

    it("key6", function () {
      const res = resolver("key6");
      expect(res.value).toEqual("ddff sfasfd ss 12");
    });

    it("key7", function () {
      const res = resolver("key7");
      expect(res.value).toEqual("ddff undefined");
    });
  });

  describe("int", function () {
    beforeAll(() => {
      setSetting({
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
      setSelection("int");
    });
    it("intKey1", function () {
      const res = resolver("intKey1");
      expect(res.value).toEqual("INT KEY 1");
    });

    it("intKey2", function () {
      const res = resolver("intKey2");
      expect(res.value).toEqual("3");
    });

    it("intKey3", function () {
      const res = resolver("intKey3");
      expect(res.value).toEqual("INT REFER SHARED ddff 12");
    });

    it("intKey4", function () {
      const res = resolver("intKey4");
      expect(res.value).toEqual("INT REFER INT 3");
    });

    it("intKey5", function () {
      const res = resolver("intKey5");
      expect(res.value).toEqual("INT REFER INT 3 INT KEY 1");
    });

    it("intKey6", function () {
      const res = resolver("intKey6");
      expect(res.value).toEqual("INT REFER SHARED ddff 12 INT REFER INT 3");
    });
  });
});
