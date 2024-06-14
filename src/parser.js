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

const rawType = "raw";
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

const errorCodes = {
  S010001: "Unprocessed text",
  S010002: "Unsupported type",
  S040001: "Invalid variable",
  S050001: "Invalid url",
  S070001: "Invalid header",
};

const parser = () => {
  "use strict";

  let create = function (type, value, error = null) {
    if (error) {
      return { type: type, error: error, value: value };
    } else {
      return { type: type, value: value };
    }
  };

  let normalizeUrl = (url) => {
    try {
      new URL(url);
      return url;
    } catch (error) {
      try {
        url = `http://${url}`;
        new URL(url);
        return url;
      } catch (error) {
        return null;
      }
    }
  };

  var tokenizer = function (type, line) {
    let isBlank = (char) => {
      return char === " " || char === "\t" || char === "\r" || char === "\n" || char === "\f" || char === "\v";
    };

    let isMetaType = (start, end, metaType) => {
      let len = metaType.length;
      return (
        ((end - start > len - 1 && isBlank(line.charAt(start + len))) || end - start === len - 1) &&
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
        return create(type, value);
      } else {
        // invalid header
        return create(type, [line.substring(start, end + 1)], {
          code: "S070001",
          stack: new Error().stack,
        });
      }
    };

    let start = 0,
      end = line.length - 1;
    if (end === -1) {
      // blank line
      if (type === headerType || type === urlType || type === curlType) {
        type = bodyType;
      }
      return create(type, null);
    }
    if (start <= end) {
      if (type !== bodyType) {
        start = skipLeftBlank(start, end);
        end = skipRightBlank(start, end);
        if (start === end && end < line.length && isBlank(line.charAt(end))) {
          // blank line
          if (type === headerType || type === urlType || type === curlType) {
            type = bodyType;
          }
          return create(type, null);
        }

        if (line.charAt(start) === "#" && line.charAt(start + 1) === "#" && line.charAt(start + 2) === "#") {
          // start with ###, rest clients seperator
          // new request block
          type = seperatorType;
          start = skipLeftBlank(start + 3, end);
          return create(type, start >= end + 1 ? [] : [line.substring(start, end + 1)]);
        }

        if (type === seperatorType || type === metaType || type === varType) {
          if (line.charAt(start) === "#" || (line.charAt(start) === "/" && line.charAt(start + 1) === "/")) {
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
            type = varType;
            let delimiter = line.indexOf("=", start + 1);
            let value = [];
            if (start + 1 < end && !isBlank(line.charAt(start + 1)) && delimiter > 0) {
              let varStart = start + 1;
              start = skipRightBlank(start, delimiter - 1);
              if (varStart <= start) {
                value.push(line.substring(varStart, start + 1));
              }
              start = skipLeftBlank(delimiter + 1, end);
              value.push(line.substring(start, end + 1));
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
                let value = start <= end ? [line.substring(start, end + 1)] : [];
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

                let url = normalizeUrl(value[1]);
                let error = undefined;
                if (url !== null) {
                  value[1] = url;
                } else {
                  error = {
                    code: "S050001",
                    stack: new Error().stack,
                  };
                }

                start = skipLeftBlank(start, end);
                if (start <= end) {
                  value.push(line.substring(start, end + 1));
                }
                return create(type, value, error);
              }
            }
          }
        } else if (type === urlType) {
          if (line.charAt(start) === "?" || line.charAt(start) === "&") {
            // url type query
            return create(type, [line.substring(start, end + 1)]);
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
        console.log(line);
        return create(bodyType, [line]);
      }
    }
  };

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
        let expr = tokenizer(type, line);
        exprs.push(expr);
        if (expr && !expr.error) {
          type = expr.type;
          if (!recover) {
            break;
          }
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

module.exports = parser;
