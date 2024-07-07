/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { datetimeAdd, datetimeFormat } = require("./util");

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

const aadToken = () => {};

const aadV2Token = () => {};

const settingVariable = (() => {
  let currentSetting = {};
  let availableSetting = {};
  let currentSeletcion = "";

  // new RegExp(`\\{{2}\\$${environment} (.+?)\\}{2}`);

  const resolver = (key) => {
    if (Object.hasOwnProperty.call(availableSetting, key)) {
      return availableSetting[key].toString();
    }
  };
  const setSetting = (setting) => {
    currentSetting = setting;
    const data = Object.assign({}, setting);
    populateVariableValue("shared", data["$shared"], data["$shared"]);
    if (currentSeletcion !== "" && Object.hasOwnProperty.call(currentSetting, currentSeletcion)) {
      populateVariableValue("shared", data[currentSeletcion], data["$shared"]);
      populateVariableValue(currentSeletcion, data[currentSeletcion], data[currentSeletcion]);
      availableSetting = Object.assign({}, data["$shared"], data[currentSeletcion]);
    } else {
      availableSetting = Object.assign({}, data["$shared"]);
    }
  };
  const setSelection = (selection) => {
    if (currentSeletcion !== selection && Object.hasOwnProperty.call(currentSetting, selection)) {
      currentSeletcion = selection;
      setSetting(currentSetting);
    }
  };
  return {
    resolver,
    setSetting,
    setSelection,
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

const variable = () => {
  const fileVar = {};
  const requestVar = {};

  const resolveSettingVariable = (key) => {
    // load from setting
    return { value: settingVariable.resolver(key) };
  };

  const resolveDotenvVariable = (key) => {
    // load from .env file
    if (key && key.startsWith("%")) {
      key = settingVariable.resolver(key.slice(1));
    }
    return { value: dotenvVariable.resolver(key) };
  };

  const resolveProcessEnvVariable = (key) => {
    if (key && key.startsWith("%")) {
      key = settingVariable.resolver(key.slice(1));
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

  let resolver = (expr) => {
    if (expr[0] === "$") {
      return resolveDynamicVariable(expr.split(" ").map((item) => item.trim()));
    } else {
      return resolveSettingVariable(expr);
    }
  };
  let process = function (exprs) {};

  return {
    resolver,
    process,
    setSelection: settingVariable.setSelection,
    setSetting: settingVariable.setSetting,
    resetDotenv: dotenvVariable.resetDotenv,
    setDotenv: dotenvVariable.setDotenv,
  };
};

module.exports = {
  variable,
};
// setting env  ($shared, env...)
// local env file (same folder .env file)
// file variable
// request variable
