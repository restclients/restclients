/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const rawType = "raw";
const seperatorType = "seperator";
const metaType = "meta";
const varType = "var";
const reqType = "req";
const headerType = "header";
const bodyType = "body";

const metaTypeName = "@name";
const metaTypeNote = "@note";
const metaTypeNoRedirect = "@no-redirect";
const metaTypeNoCookieJar = "@no-cookie-jar";
const metaTypePrompt = "@prompt";
const metaTypeComment = "@comment";

const parser = () => {
  "use strict";

  var tokenizer = function (type, line) {
    let create = function (type, value, error = null) {
      if (error) {
        return { type: type, error: error, value: value };
      } else {
        return { type: type, value: value };
      }
    };

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

    let start = 0,
      end = line.length - 1;
    if (end === -1) {
      return create(type, null);
    }
    if (start <= end) {
      start = skipLeftBlank(start, end);
      end = skipRightBlank(start, end);
      if (start === end && end < line.length && isBlank(line.charAt(end))) {
        return create(type, null);
      }
      if (type === seperatorType || type === metaType || type === varType) {
        if (line.charAt(start) === "#" || (line.charAt(start) === "/" && line.charAt(start + 1) === "/")) {
          // meta line
          type = metaType;
          if (line.charAt(start) !== "#") {
            ++start;
          }
          if (line.indexOf("###", start) === 0) {
            // new request block
            type = seperatorType;
            start = skipLeftBlank(start + 3, end);
            return create(type, start >= end + 1 ? [] : [line.substring(start, end + 1)]);
          } else if (start < end && isBlank(line.charAt(start + 1))) {
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
        } else if (line.charAt(start) === "@" && start + 1 < end && !isBlank(line.charAt(start + 1))) {
          // variable line
          let del = line.indexOf("=", start + 1);
          if (del > 0) {
            type = varType;
            let value = [];

            let varStart = start + 1;
            start = skipRightBlank(start, del - 1);
            console.log(varStart, start);
            if (varStart <= start) {
              value.push(line.substring(varStart, start + 1));
            }
            start = skipLeftBlank(del + 1, end);
            value.push(line.substring(start, end + 1));
            return create(type, value);
          } else {
            // invalid var
            if (start <= end) {
              value.push(line.substring(start, end + 1));
            }
            return create(type, value, { code: "S010001", stack: new Error().stack });
          }
        } else {
          return create(type, [line.substring(start, end + 1)], { code: "S010000", stack: new Error().stack });
        }
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
    console.log(source);
    while (position < len) {
      let lineEnd = source.indexOf("\n", position);
      if (lineEnd == -1) {
        lineEnd = source.length;
      }
      try {
        let expr = tokenizer(type, source.substring(position, lineEnd));
        type = expr.type;
        exprs.push(expr);
      } catch (error) {
        console.error(error);
      }
      position = lineEnd + 1;
    }
    return exprs;
  };

  return parser;
};

module.exports = parser;
