/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { parseArgs } = require("util");
const { executor } = require("./executor");
const { logging } = require("./util");

(async () => {
  const options = {
    rootDir: {
      type: "string",
      short: "r",
    },
    namePattern: {
      type: "string",
      short: "n",
    },
    filePattern: {
      type: "string",
      short: "f",
      multiple: true,
    },
    verbose: {
      type: "boolean",
      short: "v",
    },
    dotenvFile: {
      type: "string",
      short: "d",
    },
    settingFile: {
      type: "string",
      short: "s",
    },
    environment: {
      type: "string",
      short: "e",
    },
  };
  const { values: config } = parseArgs({ args: process.argv.slice(2), options });
  if (config.verbose) {
    logging.level("debug");
  }
  logging.debug("argv config: %j", config);
  await executor({
    rootDir: config.rootDir,
    httpClient: undefined,
    namePattern: config.namePattern,
    filePattern: config.filePattern,
    dotenvFile: config.dotenvFile,
    settingFile: config.settingFile,
    environment: config.environment,
  });
})();
