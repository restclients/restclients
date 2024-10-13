const { resolve } = require("path");
const { isArray, replacePosixSep, find, logging } = require("./util");
const { readFileSync } = require("fs");
const { variable } = require("./variable");
const { parser, seperatorType } = require("./parser");
const { evaluator } = require("./evaluator");

const executor = async function (option) {
  if (option.namePattern) {
    try {
      option.namePattern = new RegExp(option.namePattern, "i");
    } catch (err) {
      logging.error("Invalid name pattern, %O", err);
      return;
    }
  }
  if (option.filePattern && isArray(option.filePattern)) {
    try {
      option.filePattern = new RegExp([...option.filePattern].map(replacePosixSep).join("|"));
    } catch (err) {
      logging.error("Invalid file pattern, %O", err);
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

  logging.debug("find files: %j", files);

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
  logging.debug("all results: %j", result);
  return result;
};

const generateWorker = (filename, option) => {
  return async () => {
    const content = readFileSync(filename, "utf-8");
    const exprs = parser()(content);
    logging.debug("exprs: %j", exprs);
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
          const name = (isArray(exprs[startIndex].value) && exprs[startIndex].value[0]) || "";
          if (!(option.namePattern && !option.namePattern.test(name))) {
            const req = await evaluator(exprs.slice(startIndex, k), vars, {
              rootDir: option.rootDir,
              currentFilePath: filename,
            });

            req.name = name;
            req.range = [startIndex, k - 1];
            req.res = await sendRequest(req, option);
            result.push(req);
          } else {
            logging.debug("skip %O by name pattern", name);
          }
          startIndex = k;
        }
      } else if (k === exprs.length - 1 && startIndex > -1) {
        const name = (isArray(exprs[startIndex].value) && exprs[startIndex].value[0]) || "";
        if (!(option.namePattern && !option.namePattern.test(name))) {
          const req = await evaluator(exprs.slice(startIndex, k + 1), vars, {
            rootDir: option.rootDir,
            currentFilePath: filename,
          });

          req.name = name;
          req.range = [startIndex, k];
          req.fetch = await sendRequest(req, option);
          result.push(req);
        } else {
          logging.debug("skip %O by name pattern", name);
        }
      }
      ++k;
    }
    return result;
  };
};

const wrapDispatch = function (dispatch, body) {
  const fn = async function (...args) {
    const { path, origin, method, headers } = args[0] || {};
    logging.info("request to %s %s%s", method, origin, path);
    logging.info("request headers, %j", headers);
    logging.info("request payload, %O", body || "NULL");
    return dispatch.apply(this, args);
  };
  fn.isWrapped = true;
  return fn;
};

const dispatcher = async function (body) {
  let globalDispatcher = global[Symbol.for("undici.globalDispatcher.1")];
  if (!globalDispatcher) {
    try {
      await fetch();
    } catch (err) {
      logging.debug("hook dispatcher, err: %O", err);
    }
    globalDispatcher = global[Symbol.for("undici.globalDispatcher.1")];
  }
  if (globalDispatcher && typeof globalDispatcher.dispatch === "function") {
    if (!globalDispatcher.dispatch.isWrapped) {
      globalDispatcher.dispatch = wrapDispatch(globalDispatcher.dispatch, body);
    }
    return globalDispatcher;
  }
  return undefined;
};

const sendRequest = async (req, option) => {
  try {
    const response = await option.httpClient(req.url, {
      method: req.method || "GET",
      body: req.body || undefined,
      headers: req.header || {},
      dispatcher: await dispatcher(req.body),
    });
    return response;
  } catch (err) {
    logging.error("%s %s, error: %O", req.method, req.url, err);
    return err;
  }
};

module.exports.executor = executor;
