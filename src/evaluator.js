/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { urlType, headerType, bodyType, metaTypePrompt, metaType } = require("./parser");
const { isArray } = require("./util");

// evaluate stage
// the purpose of evalutor is to add as much semantic value to the exprs as possible
const evaluator = async function (exprs, vars) {
  const req = {
    header: {},
    url: "",
  };
  const header = {};
  const urls = [];
  const bodies = [];
  const variables = [];
  const promptVariables = [];

  let lasExprType = "";
  exprs.forEach((item) => {
    if (!item.error) {
      switch (item.type) {
        case metaType: {
          if (item.value && isArray(item.value)) {
            if (item.value[0] === metaTypePrompt) {
              promptVariables.push(item.value.slice(1));
            }
          }
          lasExprType = metaType;
          break;
        }
        case headerType: {
          if (item.value && isArray(item.value)) {
            const key = item.value[0];
            const value = item.value[1];
            const valueVars = item.value[item.value.length - 1];
            if (typeof key === "string" && typeof value === "string") {
              if (isArray(valueVars) && valueVars.length > 0) {
                const data = { value: value, args: structuredClone(valueVars) };
                variables.push(data);
                header[key] = data;
              } else {
                header[key] = value;
              }
            }
          }
          lasExprType = headerType;
          break;
        }
        case urlType: {
          if (item.value && isArray(item.value)) {
            let valueIndex = 0;
            if (lasExprType != urlType) {
              req.method = item.value[0];
              valueIndex++;
            }
            const value = item.value[valueIndex];
            const valueVars = item.value[item.value.length - 1];
            if (typeof value === "string") {
              if (isArray(valueVars) && valueVars.length > 0) {
                const data = { value: value, args: structuredClone(valueVars) };
                variables.push(data);
                urls.push(data);
              } else {
                urls.push({ value: value });
              }
            }
          }
          lasExprType = urlType;
          break;
        }
        case bodyType: {
          if (item.value && isArray(item.value)) {
            const value = item.value[0];
            const valueVars = item.value[item.value.length - 1];
            if (typeof value === "string") {
              if (isArray(valueVars) && valueVars.length > 0) {
                const data = { value: value, args: structuredClone(valueVars) };
                variables.push(data);
                bodies.push(data);
              } else {
                bodies.push({ value: value });
              }
            }
          }
          lasExprType = bodyType;
          break;
        }
      }
    }
  });
  if (variables.length > 0) {
    const resolvedVariables = await vars.resolvePromptVariable(promptVariables);
    vars.resolveFileVariable(variables, resolvedVariables);
  }
  for (const key of Object.keys(header)) {
    if (header[key] instanceof Object && Object.hasOwnProperty.call(header[key], "value")) {
      header[key] = header[key]["value"];
    }
  }
  req.header = header;
  req.url = urls.reduce((p, c) => p + c.value, "");
  req.body = bodies.reduce((p, c) => p + c.value, "");
  return req;
};

module.exports.evaluator = evaluator;
