const { resolve } = require("path");
const { isArray, replacePosixSep, find } = require("./util");
const { readFileSync } = require("fs");
const { variable } = require("./variable");
const { parser, seperatorType } = require("./parser");
const { evaluator } = require("./evaluator");

const executor = async function (option) {
  if (option.namePattern) {
    try {
      option.namePattern = new RegExp(option.namePattern, "i");
    } catch (err) {
      console.log("Invalid name pattern", err);
      return;
    }
  }
  if (option.filePattern && isArray(option.filePattern)) {
    try {
      option.filePattern = new RegExp([...option.filePattern].map(replacePosixSep).join("|"));
    } catch (err) {
      console.log("Invalid file pattern", err);
      return;
    }
  }
  option.rootDir = option.rootDir ? resolve(process.cwd(), option.rootDir) : process.cwd();

  option.httpClient = option.httpClient || fetch;

  let files = await new Promise((resolve) => {
    find(
      option.roots || [option.rootDir],
      ["rcs", "http"],
      () => false,
      false,
      (lists) => {
        resolve(lists);
      }
    );
  });

  files = files.filter((item) => {
    if (option.filePattern) {
      return option.filePattern.test(item[0]);
    }
    return true;
  });

  let runners = [];
  let maxWorker = 2;
  const result = [];
  for (let i = 0; i < files.length; i += maxWorker) {
    let availableCount = files.length - i;
    for (let j = 0; j < maxWorker && j < availableCount; ++j) {
      runners.push(generateWorker(files[i + j][0], option)());
    }
    result.push(...(await Promise.all(runners)));
    runners = [];
  }
  console.log(result);
  return result;
};

const generateWorker = (filename, option) => {
  return async () => {
    const content = readFileSync(filename, "utf-8");
    const exprs = parser()(content);
    const vars = variable(exprs);
    if (option.resolvePrompt) {
      vars.resolvePromptVariable = option.resolvePrompt;
    }

    let k = 0;
    let startIndex = -1;
    const result = [];
    while (k < exprs.length) {
      if (exprs[k].type === seperatorType) {
        if (startIndex === -1) {
          startIndex = k;
        } else {
          const req = await evaluator(exprs.slice(startIndex, k), vars);
          req.name = isArray(exprs[startIndex].value) && exprs[startIndex].value[0];
          if (!(option.namePattern && !option.namePattern.test(req.name))) {
            req.range = [startIndex, k - 1];
            req.fetch = await sendRequest(req, option);
            result.push(req);
          }
          startIndex = k;
        }
      } else if (k === exprs.length - 1 && startIndex > -1) {
        console.log(startIndex, k);
        console.log(exprs);
        const req = await evaluator(exprs.slice(startIndex, k + 1), vars);
        req.name = (isArray(exprs[startIndex].value) && exprs[startIndex].value[0]) || "";
        if (!(option.namePattern && !option.namePattern.test(req.name))) {
          req.range = [startIndex, k];
          req.fetch = await sendRequest(req, option);
          result.push(req);
        }
      }
      ++k;
    }
    return result;
  };
};

const sendRequest = async (req, option) => {
  try {
    const response = await option.httpClient(req.url, {
      method: req.method || "GET",
      body: req.body || undefined,
      headers: req.header || {},
    });
    return response;
  } catch (err) {
    console.log(err);
    return err;
  }
};

module.exports.executor = executor;
