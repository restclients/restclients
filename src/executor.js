const { resolve, join } = require("path");
const { Script, createContext } = require("vm");
const {
  isArray,
  replacePosixSep,
  find,
  logging,
  padding,
  colorize,
  parseContentType,
  ContentType,
  beautify,
} = require("./util");
const { readFileSync, existsSync } = require("fs");
const { variable, variableToContext } = require("./variable");
const { parser, seperatorType } = require("./parser");
const { evaluator } = require("./evaluator");
const { format } = require("util");
const { EOL } = require("os");
const { pathToFileURL } = require("url");

const executor = async function (option) {
  if (option.namePattern) {
    try {
      option.namePattern = new RegExp(option.namePattern, "i");
    } catch (err) {
      logging.error("Invalid name pattern, %j", err);
      return;
    }
  }
  if (option.filePattern && isArray(option.filePattern)) {
    try {
      option.filePattern = new RegExp([...option.filePattern].map(replacePosixSep).join("|"), "i");
    } catch (err) {
      logging.error("Invalid file pattern, %j", err);
      return;
    }
  } else {
    option.filePattern = null;
  }

  option.rootDir = option.rootDir ? resolve(process.cwd(), option.rootDir) : process.cwd();

  const dotenvFile = join(option.rootDir, option.dotenvFile || ".restclients.env");
  if (existsSync(dotenvFile)) {
    option.dotenvFile = dotenvFile;
    logging.debug("dotenv file found, %s", option.dotenvFile);
  } else {
    option.dotenvFile = null;
    logging.warn("dotenv file not found, %s or %s", option.dotenvFile, ".restclients.env");
  }

  const settingFile = join(option.rootDir, option.settingFile || "restclients.config.js");
  if (existsSync(settingFile)) {
    option.settingFile = settingFile;
    logging.debug("setting file found, %s", option.settingFile);
  } else {
    option.settingFile = null;
    logging.warn("setting file not found, %s or %s", option.settingFile, "restclients.config.js");
  }

  option.httpClient = option.httpClient || fetch;

  logging.info(
    "name pattern: %s, file pattern: %s, root dir: %s, dotenv file: %s, setting file: %s, environment: %s",
    option.namePattern,
    option.filePattern,
    option.rootDir,
    option.dotenvFile,
    option.settingFile,
    option.environment
  );
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

const execute = async (req, exprs, vars, option) => {
  Object.assign(
    req,
    await evaluator(exprs, vars, {
      rootDir: option.rootDir,
      currentFilePath: req.filename,
    })
  );

  req.res = await sendRequest(req, option);
  if (req.scriptContent) {
    const script = new Script(req.scriptContent.toString());
    script.runInContext(
      createContext({
        vars: variableToContext(vars, req.resolvePromptVariable),
        request: req,
        require,
        logging,
        option,
      })
    );
  }
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
    if (option.dotenvFile) {
      vars.setDotenvVariable(readFileSync(option.dotenvFile), "utf-8");
    }
    if (option.settingFile) {
      vars.setSettingVariable(require(option.settingFile) || {});
      if (option.environment) {
        vars.setSettingVariableSelection(option.environment);
      }
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
          const uri = `${pathToFileURL(filename)}#L${startIndex}-L${k - 1}`;
          if (!(option.namePattern && !option.namePattern.test(name))) {
            const req = {
              filename: filename,
              name: name,
              range: [startIndex, k - 1],
              uri,
            };
            logging.debug("execute request: %j", req);
            await execute(req, exprs.slice(startIndex, k), vars, option);
            result.push(req);
          } else {
            logging.debug("skip %s %j by name pattern", uri, name);
          }
          startIndex = k;
        }
      } else if (k === exprs.length - 1 && startIndex > -1) {
        const name = (isArray(exprs[startIndex].value) && exprs[startIndex].value[0]) || "";
        const uri = `${pathToFileURL(filename)}#L${startIndex}-L${k}`;
        if (!(option.namePattern && !option.namePattern.test(name))) {
          const req = {
            filename: filename,
            name: name,
            range: [startIndex, k],
            uri,
          };
          logging.debug("execute request: %j", req);
          await execute(req, exprs.slice(startIndex, k + 1), vars, option);
          result.push(req);
        } else {
          logging.debug("skip %s %j by name pattern", uri, name);
        }
      }
      ++k;
    }
    return result;
  };
};

const wrapDispatch = function (dispatch, request) {
  const fn = async function (...args) {
    const { path, origin, method, headers } = args[0] || {};
    logging.debug("request to %s %s%s", method, origin, path);
    logging.debug("request headers, %j", headers);
    logging.debug("request payload, %j", request.body || "NULL");
    request.method = method;
    request.origin = origin;
    request.path = path;
    request.headers = new Headers();
    for (const [key, value] of Object.entries(headers)) {
      request.headers.append(key, value);
    }
    return dispatch.apply(this, args);
  };
  return fn;
};

const dispatcher = async function (request) {
  let globalDispatcher = global[Symbol.for("undici.globalDispatcher.1")];
  if (!globalDispatcher) {
    try {
      await fetch();
    } catch {
      // logging.debug("hook dispatcher, err: %j", err);
    }
    globalDispatcher = global[Symbol.for("undici.globalDispatcher.1")];
  }
  if (globalDispatcher && typeof globalDispatcher.dispatch === "function") {
    return new Proxy(globalDispatcher, {
      get: (target, key) => (key === "dispatch" ? wrapDispatch(globalDispatcher.dispatch, request) : target[key]),
    });
  }
  return undefined;
};

const prettyBody = (body, contentTypeHeader) => {
  const [contentType] = parseContentType(contentTypeHeader) || [ContentType.UnknownType];
  if (contentType === ContentType.JsonType) {
    return beautify.json(body);
  } else if (contentType === ContentType.XmlType) {
    return beautify.xml(body);
  } else {
    try {
      JSON.parse(body);
      return beautify.json(body);
    } catch {
      return body;
    }
  }
};

const sendRequest = async (req, option) => {
  let request = { body: req.body };
  let rows = [];
  const width = process.stdout.columns;
  const keyWidth = 50;
  try {
    const time = performance.now();
    const response = await option.httpClient(req.url, {
      method: req.method || "GET",
      body: req.body || undefined,
      headers: req.header || {},
      dispatcher: await dispatcher(request),
    });
    const duration = performance.now() - time;
    req.time =
      duration >= 1000
        ? `${Math.floor(duration / 1000)}.${Math.floor(duration % 1000)} s`
        : `${Math.floor(duration % 1000)} ms`;

    const statusCode = response.status;
    const headers = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });

    const body = Buffer.from(await response.arrayBuffer());

    logging.debug("response statusCode: %s", statusCode);
    logging.debug("response headers: %j", headers);
    logging.debug("response body: %j", body);

    rows.push(colorize.cyan(padding(`-----General-----`, "-", width)));
    rows.push(`${padding("Request URL:", " ", keyWidth)}${request.origin}${request.path}`);
    rows.push(`${padding("Request Method:", " ", keyWidth)}${request.method}`);
    rows.push(
      `${padding("Status Code:", " ", keyWidth)}${
        statusCode >= 400 ? "\u{1F534}" : statusCode >= 300 ? "\u{1F7E1}" : "\u{1F7E2}"
      } ${statusCode} ${response.statusText}`
    );
    rows.push(`${padding("Request Time:", " ", keyWidth)}${req.time}`);
    rows.push(colorize.cyan(padding("-----Request Headers-----", "-", width)));
    request.headers &&
      request.headers.forEach((value, name) => {
        rows.push(`${padding(name + ": ", " ", keyWidth)}${value}`);
      });
    rows.push(colorize.cyan(padding("-----Request Payload-----", "-", width)));
    rows.push(request.body && request.body.toString());

    rows.push(colorize.blue(padding("-----Response Headers-----", "-", width)));
    response.headers.forEach((value, name) => {
      rows.push(`${padding(name + ": ", " ", keyWidth)}${value}`);
    });
    rows.push(colorize.blue(padding("-----Response Body Preview-----", "-", width)));
    rows.push(prettyBody(body.toString(), response.headers.get("content-type")));
    rows.push(colorize.blue(padding("-----Response Body Raw-----", "-", width)));
    rows.push(format("%j", body));

    const res = {
      statusCode: statusCode,
      headers,
      body: body,
    };
    return res;
  } catch (err) {
    logging.error("%s %s, error: %O", req.method, req.url, err);
    if (rows.length === 0) {
      rows.push(colorize.cyan(padding("-----General-----", "-", width)));
      rows.push(`${padding("Request URL:", " ", keyWidth)}${request.origin}${request.path}`);
      rows.push(`${padding("Request Method:", " ", keyWidth)}${request.method}`);
      rows.push(colorize.cyan(padding("-----Request Headers-----", "-", width)));
      request.headers.forEach((value, name) => {
        rows.push(`${padding(name + ": ", " ", keyWidth)}${value}`);
      });
    }
    return {
      error: err,
    };
  } finally {
    logging.info("Restclients Summary for Request %j\n%s", req.name, rows.join(EOL));
  }
};

module.exports.executor = executor;
