/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const parser = () => {
  "use strict";

  var tokenizer = function (type, line) {

    let create = function (type, value) {
      let obj = { type: type, value: value };
      return obj;
    };

    let skipLeftBlank = (start, end) => {
      while (start < end) {
        if (
          line.charAt(start) === " " ||
          line.charAt(start) === "\t" ||
          line.charAt(start) === "\r" ||
          line.charAt(start) === "\n"
        ) {
          ++start;
        }
      }
      return start;
    };

    let skipRightBlank = (start, end) => {
      while (start < end) {
        if (
          line.charAt(end) === " " ||
          line.charAt(end) === "\t" ||
          line.charAt(end) === "\r" ||
          line.charAt(end) === "\n"
        ) {
          --end;
        }
      }
      return end;
    };
    let start = 0, end = line.length;
    if (start < end) {
      start = skipLeftBlank(start, end);
      end = skipRightBlank(start, end);
      if (start === end) {
        return create(type, null);
      }
      if (type === "seperator" || type === "meta" || type === "var") {
        if (source.charAt(start) === "#") {
          // meta line
          if (source.indexOf("###", start) === 0) {
            // new request block
            type = "seperator";
            start = skipLeftBlank(start + 1, end);
            end = skipRightBlank(start, end);
            return create(type, start === end ? [] : [line.substring(start, end)]);
          }
        } else if (source.charAt(start) === "@") {
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
      console.log(lineEnd)
      try {
        let expr = tokenizer(type, source.substring(position, lineEnd));
        type = expr.type;
        exprs.push(expr);
      } catch (error) {}
      position = lineEnd + 1;
    }
  };

  return parser;
};

module.exports = parser;
