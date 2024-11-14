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
  if (config.debug) {
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
