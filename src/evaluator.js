/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { EOL } = require("os");
const { urlType, headerType, bodyType, metaTypePrompt, metaType, tokenizer } = require("./parser");
const { isArray, getHeader, parseContentType, ContentType, resolveFilePath } = require("./util");
const { readFileSync } = require("fs");
const { URLSearchParams } = require("url");

// evaluate stage
// the purpose of evalutor is to add as much semantic value to the exprs as possible
const evaluator = async function (exprs, vars, option) {
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
          } else {
            if (lasExprType === bodyType) {
              bodies.push({ value: null });
            }
          }
          lasExprType = bodyType;
          break;
        }
      }
    }
  });
  const resolvedVariables = await vars.resolvePromptVariable(promptVariables);
  if (variables.length > 0) {
    vars.resolveFileVariable(variables, resolvedVariables);
  }
  for (const key of Object.keys(header)) {
    if (header[key] instanceof Object && Object.hasOwnProperty.call(header[key], "value")) {
      header[key] = header[key]["value"];
    }
  }

  req.header = header;
  req.url = urls.reduce((p, c) => p + c.value, "");
  let host;
  if ((host = getHeader(header, "Host")) !== undefined && req.url[0] === "/") {
    let index;
    const port = (index = host.indexOf(":")) > 0 ? host.slice(index + 1).trim() : "";
    const scheme = port === "443" || port === "8443" ? "https" : "http";
    req.url = `${scheme}://${host}${req.url}`;
  }

  var resolveFileContent = (line) => {
    if (line.startsWith("<")) {
      let i = line.indexOf(" ");
      if (i > 0) {
        const resolveVariable = line[1] === "@";
        const encoding = (resolveVariable ? line.slice(2, i).trim() : line.slice(1, i).trim()) || "utf-8";
        let filePath = line.slice(i + 1).trim();
        if (
          (filePath = resolveFilePath(filePath, option && option.rootDir, option && option.currentFilePath)) !==
          undefined
        ) {
          const fileBuffer = readFileSync(filePath);
          if (resolveVariable) {
            const fileContent = fileBuffer.toString(encoding);
            const { process } = tokenizer(bodyType, fileContent);
            const expr = process();
            if (expr.value && isArray(expr.value)) {
              const value = expr.value[0];
              const valueVars = expr.value[expr.value.length - 1];
              if (typeof value === "string") {
                if (isArray(valueVars) && valueVars.length > 0) {
                  const content = { value: value, args: valueVars };
                  vars.resolveFileVariable([content], resolvedVariables);
                  return content.value;
                }
              }
            }
          }
          return fileBuffer;
        }
      }
    }
    return undefined;
  };

  var evaluateBody = (bodies, contentTypeHeader) => {
    const [contentType] = parseContentType(contentTypeHeader) || [ContentType.UnknownType];
    const buffers = [];
    const lineEnd = contentType === ContentType.MultipartFormDataType ? "\r\n" : EOL;
    for (let i = 0; i < bodies.length; ++i) {
      let bodyContent;
      if (typeof bodies[i].value === "string") {
        if (bodies[i].value.startsWith("<") && (bodyContent = resolveFileContent(bodies[i].value)) !== undefined) {
          buffers.push(typeof bodyContent === "string" ? Buffer.from(bodyContent) : bodyContent);
        } else {
          buffers.push(Buffer.from(bodies[i].value));
        }
      }
      console.log(bodies[i]);
      if (
        (i !== bodies.length - 1 &&
          !(contentType === ContentType.FormUrlencodedType && bodies[i + 1].value[0] === "&")) ||
        contentType === ContentType.NewlineDelimitedJsonType
      ) {
        console.log("add new line");
        buffers.push(Buffer.from(lineEnd));
      }
    }
    const body = Buffer.concat(buffers);
    if (contentType === ContentType.FormUrlencodedType) {
      return new URLSearchParams(body.toString()).toString();
    }
    return body;
  };

  req.body = evaluateBody(bodies, getHeader(req.header, "content-type"));
  return req;
};

module.exports.evaluator = evaluator;
