/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const metaTypeName = "@name";
const metaTypeNote = "@note";
const metaTypeNoRedirect = "@no-redirect";
const metaTypeNoCookieJar = "@no-cookie-jar";
const metaTypePrompt = "@prompt";
const metaTypeComment = "@comment";

const parser = () => {
  "use strict";

  var tokenizer = function (type, line) {
    let create = function (type, value) {
      let obj = { type: type, value: value };
      return obj;
    };

    let isBlank = (char) => {
      return char === " " || char === "\t" || char === "\r" || char === "\n";
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
    if (start <= end) {
      start = skipLeftBlank(start, end);
      end = skipRightBlank(start, end);
      if (start === end) {
        return create(type, null);
      }
      if (type === "seperator" || type === "meta" || type === "var") {
        if (line.charAt(start) === "#" || (line.charAt(start) === "/" && line.charAt(start + 1) === "/")) {
          // meta line
          console.log("1")
          if (line.charAt(start) !== "#") {
            ++start;
          }
          if (line.indexOf("###", start) === 0) {
            // new request block
            type = "seperator";
            start = skipLeftBlank(start + 3, end);
            return create(type, start >= end + 1 ? [] : [line.substring(start, end + 1)]);
          } else if (start < end && isBlank(line.charAt(start + 1))) {
            start = skipLeftBlank(start + 1, end);
            if (isMetaType(start, end, metaTypePrompt)) {
              // meta promt
              type = "meta";
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
              type = "meta";
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
              type = "meta";
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
              type = "meta";
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
              type = "meta";
              let value = [metaTypeNoCookieJar];
              // parse no cookie jar description
              start += metaTypeNoCookieJar.length + 1;
              start = skipLeftBlank(start, end);

              if (start <= end) {
                value.push(line.substring(start, end + 1));
              }
              return create(type, value);
            } else {
              type = "meta";
              let value = [metaTypeComment, " "];
              start = skipLeftBlank(start, end);

              if (start <= end) {
                value.push(line.substring(start, end + 1));
              }
              return create(type, value);
            }
          } else {
            type = "meta";
            let value = [metaTypeComment];
            ++start
            if (start <= end) {
              value.push(line.substring(start, end + 1));
            }
            return create(type, value);
          }
        } else if (line.charAt(start) === "@") {
          // variable line
        } else {
        }
      }
    }
  };

  var parser = function (source, recover) {
    if (!source || typeof source !== "string") {
      return null;
    }
    let len = source.length;
    let position = 0;
    let type = "seperator";
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
