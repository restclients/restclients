/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { metaType, varType, metaTypeName } = require("./parser");
const { datetimeAdd, datetimeFormat, isArray, logging } = require("./util");

const timestamp = (offset, option) => {
  const date = new Date();
  if (offset && option) {
    datetimeAdd(date, Number(offset), option);
  }
  return { value: Math.floor(date.valueOf() / 1000).toString() };
};

const utcDatetime = (type, offset, option) => {
  const date = new Date();
  if (offset && option) {
    datetimeAdd(date, Number(offset), option);
  }
  if (type === "rfc1123") {
    return {
      value: datetimeFormat(date, "UTC", "ddd, DD MMM YYYY HH:mm:ss [GMT]"),
    };
  } else if (type === "iso8601") {
    return { value: datetimeFormat(date, "UTC", "YYYY-MM-DDTHH:mm:ss.SSS[Z]") };
  } else {
    return { value: datetimeFormat(date, "UTC", type) };
  }
};

const localDatetime = (type, offset, option) => {
  const date = new Date();
  if (offset && option) {
    datetimeAdd(date, Number(offset), option);
  }
  if (type === "rfc1123") {
    return { value: datetimeFormat(date, "", "ddd, DD MMM YYYY HH:mm:ss ZZ") };
  } else if (type === "iso8601") {
    return { value: datetimeFormat(date, "", "") };
  } else {
    return { value: datetimeFormat(date, "", type) };
  }
};

const uuidv4 = () => {
  var id_str = [];
  var hxDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    id_str[i] = hxDigits[Math.floor(Math.random() * 0x10)];
  }
  id_str[14] = "4"; // bits 12-15 is for time_hi_and_version field, set to to 0010

  id_str[19] = hxDigits[(id_str[19] & 0x3) | 0x8]; // bits 6-7 for the clock_seq_hi_and_reserved to 01

  id_str[8] = id_str[13] = id_str[18] = id_str[23] = "-";

  var guid = id_str.join("");
  return guid;
};

const randomInt = (min, max) => {
  max = Number(max);
  min = Number(min);
  if (min <= max) {
    return { value: (Math.floor(Math.random() * (max - min)) + min).toString() };
  }
};

const environmentVariable = (() => {
  let currentEnvironmentVariable = {};
  let availableEnvironmentVariable = {};
  let currentEnvironment = "";

  // new RegExp(`\\{{2}\\$${environment} (.+?)\\}{2}`);
  const populateVariableValue = (environment, des, src) => {
    const variableRegex = new RegExp(`\\{{2}\\s*\\$${environment} (.+?)\\}{2}`, "gm");
    for (const [key, value] of Object.entries(des)) {
      if (typeof value === "string") {
        let match;
        let populated = false;
        let populatedValue = value;
        while ((match = variableRegex.exec(value)) !== null) {
          const referenceKey = match[1].trim();
          populatedValue = populatedValue.replace(match[0], src[referenceKey]);
          populated = true;
        }
        if (populated) {
          des[key] = populatedValue;
        }
      }
    }
  };

  const resolver = (key) => {
    if (Object.hasOwnProperty.call(availableEnvironmentVariable, key)) {
      return availableEnvironmentVariable[key].toString();
    }
  };
  const setEnvironmentVariable = (environmentVariable) => {
    currentEnvironmentVariable = environmentVariable;
    const data = Object.assign({}, environmentVariable);
    populateVariableValue("shared", data["$shared"], data["$shared"]);
    if (currentEnvironment !== "" && Object.hasOwnProperty.call(currentEnvironmentVariable, currentEnvironment)) {
      populateVariableValue("shared", data[currentEnvironment], data["$shared"]);
      populateVariableValue(currentEnvironment, data[currentEnvironment], data[currentEnvironment]);
      availableEnvironmentVariable = Object.assign({}, data["$shared"], data[currentEnvironment]);
    } else {
      availableEnvironmentVariable = Object.assign({}, data["$shared"]);
    }
  };
  const selectEnvironment = (environment) => {
    if (
      currentEnvironment !== environment &&
      Object.hasOwnProperty.call(currentEnvironmentVariable, environment) &&
      environment[0] !== "$"
    ) {
      currentEnvironment = environment;
      setEnvironmentVariable(currentEnvironmentVariable);
    }
  };
  const addEnvironmentVariable = (key, value) => {
    if (Object.hasOwnProperty.call(availableEnvironmentVariable, key)) {
      logging.warn(
        "overwrite environment variable, key: %s, value: %s, newValue: %s",
        key,
        availableEnvironmentVariable[key],
        value
      );
    }
    availableEnvironmentVariable[key] = value;
  };
  return {
    resolver,
    setEnvironmentVariable,
    selectEnvironment,
    addEnvironmentVariable,
  };
})();

const expandVariableValue = (value) => {
  const end = value.length - 1;
  const isDoubleQuoted = value[0] === '"' && value[end] === '"';
  const isSingleQuoted = value[0] === "'" && value[end] === "'";

  // if single or double quoted, remove quotes
  if (isSingleQuoted || isDoubleQuoted) {
    value = value.substring(1, end);

    // if double quoted, expand newlines
    if (isDoubleQuoted) {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }
  } else {
    // remove surrounding whitespace
    value = value.trim();
  }
  return value;
};

const dotenvVariable = (() => {
  let dotenv = {};
  let lineReg =
    /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
  const resolver = (key) => {
    if (Object.hasOwnProperty.call(dotenv, key)) {
      return dotenv[key];
    }
  };
  // load default .env file path
  // const dotenvPath = path.resolve(process.cwd(), '.env')
  const setDotenv = (src) => {
    // Convert buffer to string
    let lines = src.toString();

    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/gm, "\n");

    let match;
    while ((match = lineReg.exec(lines)) != null) {
      const key = match[1];

      // Default undefined or null to empty string
      let value = match[2] || "";
      // Add to object
      dotenv[key] = expandVariableValue(value);
    }
  };
  const resetDotenv = () => {
    dotenv = {};
  };
  return {
    resolver,
    setDotenv,
    resetDotenv,
  };
})();

const variable = (exprs) => {
  const resolvePromptVariable = async (promptVariables) => {
    let prompt = {};
    if (promptVariables.length > 0) {
      const readlinePromise = require("node:readline/promises");
      const { stdin: input, stdout: output } = require("node:process");
      const rl = readlinePromise.createInterface({ input, output });

      for (const item of promptVariables) {
        const input = await rl.question(`Input value for "${item[0]}"${`${item[1] ? ` (${item[1]})` : ""}`}\n`);
        prompt[item[0]] = { value: input, args: null };
      }
      rl.close();
    }
    return prompt;
  };

  const resolveEnvironmentVariable = (key) => {
    // load from setting
    return { value: environmentVariable.resolver(key) };
  };

  const resolveDotenvVariable = (key) => {
    // load from .env file
    if (key && key.startsWith("%")) {
      key = environmentVariable.resolver(key.slice(1));
    }
    return { value: dotenvVariable.resolver(key) };
  };

  const resolveProcessEnvVariable = (key) => {
    if (key && key.startsWith("%")) {
      key = environmentVariable.resolver(key.slice(1));
    }
    if (process && process.env) {
      const envValue = process.env[key];
      if (envValue !== undefined) {
        return { value: envValue.toString() };
      }
    }
    return { value: undefined };
  };

  const resolveDynamicVariable = (args) => {
    switch (args[0]) {
      case "$aadToken": {
        // {{$aadToken [new] [public|cn|de|us|ppe] [<domain|tenantId>] [aud:<domain|tenantId>]}}
        return;
      }
      case "$aadV2Token": {
        // {{$aadV2Token [new] [AzureCloud|AzureChinaCloud|AzureUSGovernment|ppe] [appOnly ][scopes:<scope[,]>] [tenantid:<domain|tenantId>] [clientid:<clientId>]}}
        return;
      }
      case "$guid": {
        // {{$guid}}
        return { value: uuidv4() };
      }
      case "$processEnv": {
        // {{$processEnv [%]envVarName}}
        return resolveProcessEnvVariable(args[1]);
      }
      case "$dotenv": {
        // {{$dotenv [%]variableName}}
        return resolveDotenvVariable(args[1]);
      }
      case "$randomInt": {
        // {{$randomInt min max}}
        return randomInt(...args.slice(1));
      }
      case "$timestamp": {
        // {{$timestamp [offset option]}}
        return timestamp(...args.slice(1));
      }
      case "$datetime": {
        // {{$datetime rfc1123|iso8601|"custom format"|'custom format' [offset option]}}
        return utcDatetime(...args.slice(1));
      }
      case "$localDatetime": {
        // {{$localDatetime rfc1123|iso8601|"custom format"|'custom format' [offset option]}}
        return localDatetime(...args.slice(1));
      }
    }
  };

  const getReferenceKey = (key) => {
    if (typeof key === "string" && (key.startsWith("%") || key.startsWith("@"))) {
      return key.substring(1);
    }
    return key;
  };

  const populateVariableValue = (variable, target, key, replacementKey, resolvedValue) => {
    let item = target ? variable[target] : variable;
    if (key[0] === "%") {
      item.value = item.value.replace(replacementKey, encodeURIComponent(resolvedValue));
    } else if (key[0] === "@") {
      item.value = item.value.replace(replacementKey, Buffer.from(resolvedValue).toString("base64"));
    } else {
      item.value = item.value.replace(replacementKey, resolvedValue);
    }
  };

  const documentVariable = ((exprs) => {
    let fileVariable = {};
    let requestVariable = {};

    let resolvedVariables = [];
    let reference = {};
    for (const expr of exprs) {
      // build file variable
      if (expr && expr.type === varType && isArray(expr.value) && expr.value.length >= 2) {
        if (expr.value.length > 2 && isArray(expr.value[2]) && expr.value[2].length >= 2) {
          fileVariable[expr.value[0]] = { value: expr.value[1], args: expr.value[2] };
        } else {
          fileVariable[expr.value[0]] = { value: expr.value[1], args: null };
          resolvedVariables.push(expr.value[0]);
        }
      }
      // build request variable
      if (
        expr &&
        expr.type === metaType &&
        isArray(expr.value) &&
        expr.value.length >= 2 &&
        expr.value[0] === metaTypeName
      ) {
        requestVariable[expr.value[1]] = null;
      }
    }

    for (const [key, { args }] of Object.entries(fileVariable)) {
      if (isArray(args) && args.length >= 2) {
        for (let i = 0; i < args.length - 1; i += 2) {
          if (isArray(args[i + 1]) && args[i + 1].length === 1 && !args[i + 1][0].startsWith("$")) {
            let referenceKey = getReferenceKey(args[i + 1][0]);
            if (Object.hasOwnProperty.call(fileVariable, referenceKey)) {
              if (reference[referenceKey]) {
                reference[referenceKey].push(key);
              } else {
                reference[referenceKey] = [key];
              }
            }
          }
        }
      }
    }

    while (resolvedVariables.length > 0) {
      let resolved = resolvedVariables.pop();
      if (reference[resolved] && fileVariable[resolved]) {
        let resolvedValue = fileVariable[resolved].value;
        for (const target of reference[resolved]) {
          if (fileVariable[target]) {
            let args = fileVariable[target].args;
            let resolvedIndex = [];
            if (isArray(args) && args.length >= 2) {
              for (let i = 0; i < args.length - 1; i += 2) {
                if (isArray(args[i + 1]) && args[i + 1].length === 1 && getReferenceKey(args[i + 1][0]) === resolved) {
                  populateVariableValue(fileVariable, target, args[i + 1][0], args[i], resolvedValue);
                  resolvedIndex.push(i);
                }
              }
            }
            if (resolvedIndex.length > 0) {
              let removedCount = 0;
              for (const removed of resolvedIndex) {
                args.splice(removed - removedCount, 2);
                removedCount += 2;
              }
            }
            if (args.length < 2) {
              // all dependency resolved
              resolvedVariables.push(target);
            }
          }
        }
      }
    }
    logging.debug("fileVariable: %j, reference %j", fileVariable, reference);

    const resolveFileVariable = (variables, resolvedFileVariable) => {
      const resolved = [];
      resolvedFileVariable = resolvedFileVariable || {};

      const resolveFileVariableDependencies = (variable) => {
        let fileVariableDependencies = [];
        if (isArray(variable.args) && variable.args.length >= 2) {
          let resolvedIndex = [];
          for (let i = 0; i < variable.args.length - 1; i += 2) {
            if (
              isArray(variable.args[i + 1]) &&
              variable.args[i + 1].length === 1 &&
              !variable.args[i + 1][0].startsWith("$")
            ) {
              let referenceKey = getReferenceKey(variable.args[i + 1][0]);
              if (Object.hasOwnProperty.call(fileVariable, referenceKey)) {
                if (
                  fileVariable[referenceKey].args === null ||
                  (isArray(fileVariable[referenceKey].args) && fileVariable[referenceKey].args.length < 2)
                ) {
                  // no dependency variable
                  populateVariableValue(
                    variable,
                    undefined,
                    variable.args[i + 1][0],
                    variable.args[i],
                    fileVariable[referenceKey].value
                  );
                  resolvedIndex.push(i);
                } else {
                  if (
                    !Object.hasOwnProperty.call(resolvedFileVariable, referenceKey) &&
                    fileVariableDependencies.indexOf(referenceKey) < 0
                  ) {
                    fileVariableDependencies.push(referenceKey);
                  }
                }
              } else {
                let { value } = resolveEnvironmentVariable(referenceKey);
                if (value !== undefined) {
                  populateVariableValue(variable, undefined, variable.args[i + 1][0], variable.args[i], value);
                  resolvedIndex.push(i);
                }
              }
            } else {
              let { value } = resolveDynamicVariable(variable.args[i + 1]);
              if (value !== undefined) {
                populateVariableValue(variable, undefined, variable.args[i + 1][0], variable.args[i], value);
                resolvedIndex.push(i);
              }
            }
          }

          if (resolvedIndex.length > 0) {
            let removedCount = 0;
            for (const removed of resolvedIndex) {
              variable.args.splice(removed - removedCount, 2);
              removedCount += 2;
            }
          }
        }

        return fileVariableDependencies;
      };

      for (const variable of variables) {
        let dependencies = resolveFileVariableDependencies(variable);
        while (dependencies.length > 0) {
          let dependency = dependencies.pop();
          if (!Object.hasOwnProperty.call(resolvedFileVariable, dependency)) {
            resolvedFileVariable[dependency] = structuredClone(fileVariable[dependency]);
            if (
              resolvedFileVariable[dependency].args === null ||
              (isArray(resolvedFileVariable[dependency].args) && resolvedFileVariable[dependency].args.length < 2)
            ) {
              if (resolved.indexOf(dependency) < 0) {
                resolved.push(dependency);
              }
            }

            for (const [referenceKey, dependents] of Object.entries(reference)) {
              if (dependents.indexOf(dependency) >= 0) {
                if (!Object.hasOwnProperty.call(resolvedFileVariable, referenceKey)) {
                  dependencies.push(referenceKey);
                }
              }
            }
          }
        }
      }

      logging.debug("resolvedFileVariable: %j, resolved: %j", resolvedFileVariable, resolved);

      for (let key of Object.keys(resolvedFileVariable)) {
        let args = resolvedFileVariable[key].args;
        let resolvedIndex = [];
        if (isArray(args) && args.length >= 2) {
          for (let i = 0; i < args.length - 1; i += 2) {
            if (isArray(args[i + 1]) && args[i + 1].length === 1 && !args[i + 1][0].startsWith("$")) {
              let referenceKey = getReferenceKey(args[i + 1][0]);
              if (!Object.hasOwnProperty.call(fileVariable, referenceKey)) {
                let { value } = resolveEnvironmentVariable(referenceKey);
                if (value !== undefined) {
                  populateVariableValue(resolvedFileVariable, key, args[i + 1][0], args[i], value);
                  resolvedIndex.push(i);
                }
              }
            } else {
              let { value } = resolveDynamicVariable(args[i + 1]);
              if (value !== undefined) {
                populateVariableValue(resolvedFileVariable, key, args[i + 1][0], args[i], value);
                resolvedIndex.push(i);
              }
            }
          }
          if (resolvedIndex.length > 0) {
            let removedCount = 0;
            for (const removed of resolvedIndex) {
              args.splice(removed - removedCount, 2);
              removedCount += 2;
            }
          }
          if (args.length < 2) {
            // all dependency resolved
            if (resolved.indexOf(key) < 0) {
              resolved.push(key);
            }
          }
        }
      }

      logging.debug("resolvedFileVariable: %j, resolved: %j", resolvedFileVariable, resolved);

      while (resolved.length > 0) {
        let resolvedKey = resolved.pop();
        if (reference[resolvedKey] && resolvedFileVariable[resolvedKey]) {
          let resolvedValue = resolvedFileVariable[resolvedKey].value;
          for (const target of reference[resolvedKey]) {
            if (resolvedFileVariable[target]) {
              let args = resolvedFileVariable[target].args;
              let resolvedIndex = [];
              if (isArray(args) && args.length >= 2) {
                for (let i = 0; i < args.length - 1; i += 2) {
                  if (isArray(args[i + 1]) && args[i + 1].length === 1 && getReferenceKey(args[i + 1][0])) {
                    populateVariableValue(resolvedFileVariable, target, args[i + 1][0], args[i], resolvedValue);
                    resolvedIndex.push(i);
                  }
                }
              }
              if (resolvedIndex.length > 0) {
                let removedCount = 0;
                for (const removed of resolvedIndex) {
                  args.splice(removed - removedCount, 2);
                  removedCount += 2;
                }
              }
              if (args.length < 2) {
                // all dependency resolved
                resolved.push(target);
              }
            }
          }
        }
      }

      for (const variable of variables) {
        if (isArray(variable.args) && variable.args.length >= 2) {
          let resolvedIndex = [];
          for (let i = 0; i < variable.args.length - 1; i += 2) {
            if (
              isArray(variable.args[i + 1]) &&
              variable.args[i + 1].length === 1 &&
              !variable.args[i + 1][0].startsWith("$")
            ) {
              let referenceKey = getReferenceKey(variable.args[i + 1][0]);
              if (Object.hasOwnProperty.call(resolvedFileVariable, referenceKey)) {
                populateVariableValue(
                  variable,
                  undefined,
                  variable.args[i + 1][0],
                  variable.args[i],
                  resolvedFileVariable[referenceKey].value
                );
                resolvedIndex.push(i);
              }
            }
          }
          if (resolvedIndex.length > 0) {
            let removedCount = 0;
            for (const removed of resolvedIndex) {
              variable.args.splice(removed - removedCount, 2);
              removedCount += 2;
            }
          }
        }
      }
    };

    const setRequestVariable = (key, req) => {
      requestVariable[key] = req;
    };

    const addFileVariable = (key, value) => {
      if (Object.hasOwnProperty.call(fileVariable, key)) {
        logging.warn("overwrite file variable, key: %s, value: %s, newValue: %s", key, fileVariable[key], value);
      }
      fileVariable[key] = { value: value, args: null };
    };

    return {
      resolveFileVariable,
      setRequestVariable,
      addFileVariable,
    };
  })(exprs);

  return {
    selectEnvironment: environmentVariable.selectEnvironment,
    setEnvironmentVariable: environmentVariable.setEnvironmentVariable,
    addEnvironmentVariable: environmentVariable.addEnvironmentVariable,
    resetDotenvVariable: dotenvVariable.resetDotenv,
    setDotenvVariable: dotenvVariable.setDotenv,
    resolvePromptVariable,
    resolveDynamicVariable,
    resolveEnvironmentVariable,
    resolveFileVariable: documentVariable.resolveFileVariable,
    setRequestVariable: documentVariable.setRequestVariable,
    addFileVariable: documentVariable.addFileVariable,
  };
};

const variableToContext = (vars, resolvedVariables) => {
  return {
    addEnvironmentVariable: vars.addEnvironmentVariable,
    addFileVariable: vars.addFileVariable,
    resolveVariables: (...args) => {
      const variables = (isArray(args[0]) ? args[0] : args).map((arg) => {
        return {
          value: `{{${arg}}}`,
          args: [`{{${arg}}}`, [`${arg}`]],
        };
      });
      vars.resolveFileVariable(variables, resolvedVariables);
      return variables.map((variable) => variable.value);
    },
  };
};

module.exports = {
  variable,
  variableToContext,
};
// setting env  ($shared, env...)
// local env file (same folder .env file)
// file variable
// request variable
