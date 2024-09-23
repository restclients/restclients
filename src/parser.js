/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const methods = [
  "ACL",
  "BIND",
  "CHECKOUT",
  "CONNECT",
  "COPY",
  "DELETE",
  "GET",
  "HEAD",
  "LINK",
  "LOCK",
  "M-SEARCH",
  "MERGE",
  "MKACTIVITY",
  "MKCALENDAR",
  "MKCOL",
  "MOVE",
  "NOTIFY",
  "OPTIONS",
  "PATCH",
  "POST",
  "PROPFIND",
  "PROPPATCH",
  "PURGE",
  "PUT",
  "REBIND",
  "REPORT",
  "SEARCH",
  "SOURCE",
  "SUBSCRIBE",
  "TRACE",
  "UNBIND",
  "UNLINK",
  "UNLOCK",
  "UNSUBSCRIBE",
];

const seperatorType = "seperator";
const metaType = "meta";
const varType = "var";
const urlType = "url";
const curlType = "curl";
const headerType = "header";
const bodyType = "body";

const metaTypeName = "@name";
const metaTypeNote = "@note";
const metaTypeNoRedirect = "@no-redirect";
const metaTypeNoCookieJar = "@no-cookie-jar";
const metaTypePrompt = "@prompt";
const metaTypeComment = "@comment";
const metaTypeCode = "@code";

const errorCodes = {
  S010001: "Unprocessed text",
  S010002: "Unsupported type",
  S040001: "Invalid variable",
  S050001: "Invalid url",
  S070001: "Invalid header",
};

let create = function (type, value, error = null) {
  if (error) {
    return { type: type, error: error, value: value };
  } else {
    return { type: type, value: value };
  }
};

var tokenizer = function (type, line) {
  let isBlank = (char) => {
    return (
      char === " " ||
      char === "\t" ||
      char === "\r" ||
      char === "\n" ||
      char === "\f" ||
      char === "\v"
    );
  };

  let isMetaType = (start, end, metaType) => {
    let len = metaType.length;
    return (
      ((end - start > len - 1 && isBlank(line.charAt(start + len))) ||
        end - start === len - 1) &&
      line.substring(start, start + len).toLowerCase() === metaType
    );
  };

  let nextBlank = (start, end) => {
    if (start > end) {
      return end + 1;
    }
    while (start <= end && !isBlank(line.charAt(start))) {
      ++start;
    }
    return start;
  };

  let skipLeftBlank = (start, end) => {
    if (start > end) {
      return end + 1;
    }
    while (start < end && isBlank(line.charAt(start))) {
      ++start;
    }
    return start;
  };

  let skipRightBlank = (start, end) => {
    if (start > end) {
      return end + 1;
    }
    while (start < end && isBlank(line.charAt(end))) {
      --end;
    }
    return end;
  };

  let extractVarArgs = (start, end) => {
    let args = [];
    while (start <= end) {
      let varStart = start;
      start = nextBlank(start, end);
      if (varStart < start) {
        args.push(line.substring(varStart, start));
        start = skipLeftBlank(start + 1, end);
      }
    }
    return args;
  };

  let extractVar = (start, end) => {
    let vars = [];
    while (start < end) {
      start = line.indexOf("{{", start);
      if (start === -1) {
        break;
      }
      let varStart = start;
      start = line.indexOf("}}", start + 2);
      if (start === -1) {
        break;
      }
      let wStart = skipLeftBlank(varStart + 2, start - 1);
      if (!isBlank(wStart)) {
        vars.push(line.substring(varStart, start + 2));
        vars.push(extractVarArgs(wStart, skipRightBlank(wStart, start - 1)));
      }
      start = start + 2;
    }
    return vars;
  };

  let parseHeader = (start, end) => {
    let type = headerType;
    let delimiter = line.indexOf(":", start);
    if (delimiter > 0) {
      let value = [];

      let varStart = start;
      start = skipRightBlank(start, delimiter - 1);
      if (varStart <= start) {
        value.push(line.substring(varStart, start + 1));
      }
      start = skipLeftBlank(delimiter + 1, end);
      value.push(line.substring(start, end + 1));
      let vars = extractVar(start, end + 1);
      if (vars.length > 0) {
        value.push(vars);
      }
      return create(type, value);
    } else {
      // invalid header
      return create(type, [line.substring(start, end + 1)], {
        code: "S070001",
        stack: new Error().stack,
      });
    }
  };

  let parseBlankLine = (type) => {
    if (type === headerType || type === urlType || type === curlType) {
      type = bodyType;
    }
    return create(type, null);
  };

  let parseVar = (start, end) => {
    let type = varType;
    let delimiter = line.indexOf("=", start);
    let value = [];
    if (start < end && !isBlank(line.charAt(start)) && delimiter > 0) {
      let varStart = start;
      start = skipRightBlank(start, delimiter - 1);
      if (varStart <= start) {
        value.push(line.substring(varStart, start + 1));
      }
      start = skipLeftBlank(delimiter + 1, end);
      value.push(line.substring(start, end + 1));
      let vars = extractVar(start, end + 1);
      if (vars.length > 0) {
        value.push(vars);
      }
      return create(type, value);
    } else {
      // invalid var
      if (start <= end) {
        value.push(line.substring(start, end + 1));
      }
      return create(type, value, {
        code: "S040001",
        stack: new Error().stack,
      });
    }
  };

  let process = () => {
    let start = 0,
      end = line.length - 1;
    if (end === -1) {
      // blank line
      return parseBlankLine(type);
    }
    if (start <= end) {
      if (type !== bodyType) {
        start = skipLeftBlank(start, end);
        end = skipRightBlank(start, end);
        if (start === end && end < line.length && isBlank(line.charAt(end))) {
          // blank line
          return parseBlankLine(type);
        }

        if (
          line.charAt(start) === "#" &&
          line.charAt(start + 1) === "#" &&
          line.charAt(start + 2) === "#"
        ) {
          // start with ###, rest clients seperator
          // new request block
          type = seperatorType;
          start = skipLeftBlank(start + 3, end);
          return create(
            type,
            start >= end + 1 ? [] : [line.substring(start, end + 1)]
          );
        }

        if (type === seperatorType || type === metaType || type === varType) {
          if (
            line.charAt(start) === "#" ||
            (line.charAt(start) === "/" && line.charAt(start + 1) === "/")
          ) {
            // meta line
            type = metaType;

            // skip for //
            if (line.charAt(start) !== "#") {
              ++start;
            }

            if (start < end && isBlank(line.charAt(start + 1))) {
              start = skipLeftBlank(start + 1, end);
              if (isMetaType(start, end, metaTypePrompt)) {
                // meta promt
                let value = [metaTypePrompt];
                // parse prompt key
                start += metaTypePrompt.length + 1;
                start = skipLeftBlank(start, end);
                let varStart = start;
                start = nextBlank(start, end);
                if (varStart < start) {
                  value.push(line.substring(varStart, start));
                }
                // parse prompt description
                ++start;
                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              } else if (isMetaType(start, end, metaTypeNote)) {
                // meta note
                let value = [metaTypeNote];
                // parse note description
                start += metaTypeNote.length + 1;
                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              } else if (isMetaType(start, end, metaTypeName)) {
                // meta name
                let value = [metaTypeName];
                // parse name key
                start += metaTypeName.length + 1;
                start = skipLeftBlank(start, end);
                let varStart = start;
                start = nextBlank(start, end);
                if (varStart < start) {
                  value.push(line.substring(varStart, start));
                }
                // parse name description
                ++start;
                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              } else if (isMetaType(start, end, metaTypeNoRedirect)) {
                // meta no redirect
                let value = [metaTypeNoRedirect];
                // parse no redirect description
                start += metaTypeNoRedirect.length + 1;
                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              } else if (isMetaType(start, end, metaTypeNoCookieJar)) {
                // meta no cookie jar
                let value = [metaTypeNoCookieJar];
                // parse no cookie jar description
                start += metaTypeNoCookieJar.length + 1;
                start = skipLeftBlank(start, end);

                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              } else if (isMetaType(start, end, metaTypeCode)) {
                // meta code
                let value = [metaTypeCode];
                // parse code file path
                start += metaTypeCode.length + 1;
                start = skipLeftBlank(start, end);
                let varStart = start;
                start = nextBlank(start, end);
                if (varStart < start) {
                  value.push(line.substring(varStart, start));
                }
                return create(type, value);
              } else {
                // meta comment
                let value = [metaTypeComment, " "];
                start = skipLeftBlank(start, end);

                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value);
              }
            } else {
              // meta comment
              let value = [metaTypeComment];
              ++start;
              if (start <= end) {
                value.push(line.substring(start, end + 1));
              }
              return create(type, value);
            }
          } else if (line.charAt(start) === "@") {
            // variable line
            ++start;
            return parseVar(start, end);
          } else {
            // should be url type
            let varStart = start;
            start = nextBlank(start, end);
            if (varStart < start) {
              let word = line.substring(varStart, start).toUpperCase();
              if (word === "CURL") {
                // curl type
                type = curlType;
                start = skipLeftBlank(start, end);
                let value =
                  start <= end ? [line.substring(start, end + 1)] : [];
                let vars = extractVar(start, end + 1);
                if (vars.length > 0) {
                  value.push(vars);
                }
                return create(type, value);
              } else {
                type = urlType;
                let value = [];
                if (methods.indexOf(word) >= 0) {
                  value.push(word);
                  start = skipLeftBlank(start, end);
                  varStart = start;
                  start = nextBlank(start, end);
                  if (varStart < start) {
                    value.push(line.substring(varStart, start));
                  }
                } else {
                  value.push("GET");
                  value.push(line.substring(varStart, start));
                }

                let vars = extractVar(varStart, start);

                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                if (vars.length > 0) {
                  value.push(vars);
                }
                return create(type, value);
              }
            }
          }
        } else if (type === urlType) {
          if (line.charAt(start) === "?" || line.charAt(start) === "&") {
            // url type query
            let value = [line.substring(start, end + 1)];
            let vars = extractVar(start, end + 1);
            if (vars.length > 0) {
              value.push(vars);
            }
            return create(type, value);
          } else {
            // header type
            return parseHeader(start, end);
          }
        } else if (type === headerType) {
          // header type
          return parseHeader(start, end);
        } else {
          return create(type, [line.substring(start, end + 1)], {
            code: "S010002",
            stack: new Error().stack,
          });
        }
      } else {
        // body type
        let value = [line];
        let vars = extractVar(start, end + 1);
        if (vars.length > 0) {
          value.push(vars);
        }
        return create(bodyType, value);
      }
    }
  };
  return { process };
};

const parser = () => {
  "use strict";

  var parser = function (source, recover) {
    if (!source || typeof source !== "string") {
      return [];
    }
    let len = source.length;
    let position = 0;
    let type = seperatorType;
    let exprs = [];
    while (position < len) {
      let lineEnd = source.indexOf("\n", position);
      if (lineEnd == -1) {
        lineEnd = source.length;
      }
      let line = source.substring(position, lineEnd);
      try {
        const { process } = tokenizer(type, line);
        let expr = process();
        exprs.push(expr);
        if (expr && !expr.error) {
          type = expr.type;
        }
      } catch (error) {
        console.error(error);
        exprs.push(
          create(type, [line], {
            code: "S010001",
            stack: new Error().stack,
          })
        );
        if (!recover) {
          break;
        }
      }
      position = lineEnd + 1;
    }
    return exprs;
  };

  return parser;
};

module.exports = {
  tokenizer,
  parser,
  seperatorType,
  metaType,
  varType,
  urlType,
  curlType,
  headerType,
  bodyType,
  metaTypeName,
  metaTypeNote,
  metaTypeNoRedirect,
  metaTypeNoCookieJar,
  metaTypePrompt,
  metaTypeComment,
  errorCodes,
};
