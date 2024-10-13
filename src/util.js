/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

const { sep, join, extname, isAbsolute, dirname, basename } = require("path");
const { readdir, stat: astat, lstat, existsSync } = require("fs");
const { format } = require("util");

exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// datetime

exports.datetimeFormat = (datetime, utc, format) => {
  const str = format || "YYYY-MM-DDTHH:mm:ssZ";
  let d;
  if (utc && utc.toUpperCase() === "UTC") {
    d = {
      $y: datetime.getUTCFullYear(),
      $M: datetime.getUTCMonth(),
      $D: datetime.getUTCDate(),
      $W: datetime.getUTCDay(),
      $H: datetime.getUTCHours(),
      $m: datetime.getUTCMinutes(),
      $s: datetime.getUTCSeconds(),
      $ms: datetime.getUTCMilliseconds(),
    };
  } else {
    d = {
      $y: datetime.getFullYear(),
      $M: datetime.getMonth(),
      $D: datetime.getDate(),
      $W: datetime.getDay(),
      $H: datetime.getHours(),
      $m: datetime.getMinutes(),
      $s: datetime.getSeconds(),
      $ms: datetime.getMilliseconds(),
    };
  }

  const padStart = (string, length, pad) => {
    const s = String(string);
    if (!s || s.length >= length) return string;
    return `${Array(length + 1 - s.length).join(pad)}${string}`;
  };
  const zoneStr =
    utc && utc.toUpperCase() === "UTC"
      ? "+00:00"
      : ((datetime) => {
          // utc offset
          const negMinutes = Math.round(datetime.getTimezoneOffset() / 15) * 15;
          const minutes = Math.abs(negMinutes);
          const hourOffset = Math.floor(minutes / 60);
          const minuteOffset = minutes % 60;
          return `${negMinutes <= 0 ? "+" : "-"}${padStart(hourOffset, 2, "0")}:${padStart(minuteOffset, 2, "0")}`;
        })(datetime);

  const getShort = (arr, index, full, length) =>
    (arr && (arr[index] || arr(this, str))) || full[index].slice(0, length);

  const { weekdays, weekdaysShort, weekdaysMin, months, monthsShort, meridiem } = {
    weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
    weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
    weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
    months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
    monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
  };

  // const get$H = (num) => padStart(datetime.getHours() % 12 || 12, num, "0");

  const meridiemFunc =
    meridiem ||
    ((hour, minute, isLowercase) => {
      const m = hour < 12 ? "AM" : "PM";
      return isLowercase ? m.toLowerCase() : m;
    });

  const matches = (match) => {
    switch (match) {
      case "YY":
        return String(d.$y).slice(-2);
      case "YYYY":
        return padStart(d.$y, 4, "0");
      case "M":
        return d.$M + 1;
      case "MM":
        return padStart(d.$M + 1, 2, "0");
      case "MMM":
        return getShort(monthsShort, d.$M, months, 3);
      case "MMMM":
        return getShort(months, d.$M);
      case "D":
        return d.$D;
      case "DD":
        return padStart(d.$D, 2, "0");
      case "d":
        return String(d.$W);
      case "dd":
        return getShort(weekdaysMin, d.$W, weekdays, 2);
      case "ddd":
        return getShort(weekdaysShort, d.$W, weekdays, 3);
      case "dddd":
        return weekdays[d.$W];
      case "H":
        return String(d.$H);
      case "HH":
        return padStart(d.$H, 2, "0");
      case "h":
        return padStart(d.$H % 12 || 12, 1, "0");
      case "hh":
        return padStart(d.$H % 12 || 12, 2, "0");
      case "a":
        return meridiemFunc(d.$H, d.$m, true);
      case "A":
        return meridiemFunc(d.$H, d.$m, false);
      case "m":
        return String(d.$m);
      case "mm":
        return padStart(d.$m, 2, "0");
      case "s":
        return String(d.$s);
      case "ss":
        return padStart(d.$s, 2, "0");
      case "SSS":
        return padStart(d.$ms, 3, "0");
      case "Z":
        return zoneStr; // 'ZZ' logic below
      default:
        break;
    }
    return null;
  };

  return str.replace(
    /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,
    (match, $1) => $1 || matches(match) || zoneStr.replace(":", "")
  ); // 'ZZ'
};

exports.datetimeAdd = (datetime, offset, option) => {
  switch (option) {
    case "y":
      datetime.setFullYear(datetime.getFullYear() + offset);
      return;
    case "M":
      datetime.setMonth(datetime.getMonth() + offset);
      return;
    case "w":
      datetime.setDate(datetime.getDate() + offset * 7);
      return;
    case "d":
      datetime.setDate(datetime.getDate() + offset);
      return;
    case "h":
      datetime.setHours(datetime.getHours() + offset);
      return;
    case "m":
      datetime.setMinutes(datetime.getMinutes() + offset);
      return;
    case "s":
      datetime.setSeconds(datetime.getSeconds() + offset);
      return;
    case "ms":
      datetime.setMilliseconds(datetime.getMilliseconds() + offset);
      return;
    default:
      return;
  }
};

exports.isArray = (arr) => {
  return arr && (arr instanceof Array || Array.isArray(arr));
};

exports.replacePosixSep = (pattern) => {
  // yargs coerces positional args into numbers
  const patternAsString = pattern.toString();
  if (sep === "/") {
    return patternAsString;
  }
  return patternAsString.replace(/\//g, "\\\\");
};

// copy from jest find
exports.find = (roots, extensions, ignore, enableSymlinks, callback) => {
  const result = [];
  let activeCalls = 0;
  function search(directory) {
    activeCalls++;
    readdir(
      directory,
      {
        withFileTypes: true,
      },
      (err, entries) => {
        activeCalls--;
        if (err) {
          if (activeCalls === 0) {
            callback(result);
          }
          return;
        }
        entries.forEach((entry) => {
          const file = join(directory, entry.name);
          if (ignore(file)) {
            return;
          }
          if (entry.isSymbolicLink()) {
            return;
          }
          if (entry.isDirectory()) {
            search(file);
            return;
          }
          activeCalls++;
          const stat = enableSymlinks ? astat : lstat;
          stat(file, (err, stat) => {
            activeCalls--;

            // This logic is unnecessary for node > v10.10, but leaving it in
            // since we need it for backwards-compatibility still.
            if (!err && stat && !stat.isSymbolicLink()) {
              if (stat.isDirectory()) {
                search(file);
              } else {
                const ext = extname(file).substr(1);
                if (extensions.indexOf(ext) !== -1) {
                  result.push([file, stat.mtime.getTime(), stat.size]);
                }
              }
            }
            if (activeCalls === 0) {
              callback(result);
            }
          });
        });
        if (activeCalls === 0) {
          callback(result);
        }
      }
    );
  }
  if (roots.length > 0) {
    roots.forEach(search);
  } else {
    callback(result);
  }
};

exports.resolveFilePath = (path, rootDir, currentFilePath) => {
  if (isAbsolute(path)) {
    return existsSync(path) ? path : undefined;
  }
  if (rootDir) {
    const absolutePath = join(rootDir, path);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  if (currentFilePath) {
    const absolutePath = join(dirname(currentFilePath), path);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }
  return undefined;
};

exports.ContentType = {
  UnknownType: 0,
  JsonType: 1,
  XmlType: 2,
  HtmlType: 3,
  JavascriptType: 4,
  CssType: 5,
  MultipartMixedType: 6,
  MultipartFormDataType: 7,
  FormUrlencodedType: 8,
  NewlineDelimitedJsonType: 9,
};

exports.parseContentType = (contentType) => {
  if (contentType) {
    let i = contentType.indexOf(";");
    if (i > 0) {
      contentType = contentType.slice(0, i);
    }
    const essence = contentType.trim();
    const [type, subtype] = essence.split("/");
    if (
      essence === "application/json" ||
      essence === "text/json" ||
      subtype.endsWith("+json") ||
      subtype.startsWith("x-amz-json")
    ) {
      return [this.ContentType.JsonType, essence, type, subtype];
    } else if (essence === "application/xml" || essence === "text/xml" || subtype.endsWith("+xml")) {
      return [this.ContentType.XmlType, essence, type, subtype];
    } else if (essence === "text/html") {
      return [this.ContentType.HtmlType, essence, type, subtype];
    } else if (essence === "application/javascript" || essence === "text/javascript") {
      return [this.ContentType.JavascriptType, essence, type, subtype];
    } else if (essence === "text/css") {
      return [this.ContentType.CssType, essence, type, subtype];
    } else if (essence === "multipart/mixed") {
      return [this.ContentType.MultipartMixedType, essence, type, subtype];
    } else if (essence === "multipart/form-data") {
      return [this.ContentType.MultipartFormDataType, essence, type, subtype];
    } else if (essence === "application/x-www-form-urlencoded") {
      return [this.ContentType.FormUrlencodedType, essence, type, subtype];
    } else if (essence === "application/x-ndjson") {
      return [this.ContentType.NewlineDelimitedJsonType, essence, type, subtype];
    } else {
      return [this.ContentType.UnknownType, essence, type, subtype];
    }
  }
};

exports.getHeader = (headers, key) => {
  if (headers && typeof headers === "object") {
    key = key.toLocaleLowerCase();
    for (const item of Object.entries(headers)) {
      if (item[0].toLocaleLowerCase() === key) {
        return item[1];
      }
    }
  }
  return undefined;
};

exports.logging = (() => {
  const levels = ["trace", "debug", "info", "warn", "error"];
  let logLevel = 2;
  const shouldLogging = (level) => level >= logLevel;
  const needStack = (level) => level <= 1;
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i;
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/i;
  const log = (type, level, msg) => {
    if (needStack(level)) {
      // get call stack, and analyze it
      // get all file,method and line number
      var stacklist = new Error().stack.split("\n").slice(3);
      var s = stacklist[0],
        sp = stackReg.exec(s) || stackReg2.exec(s);
      var stack = {};
      if (sp && sp.length === 5) {
        stack.path = sp[2];
        stack.line = parseInt(sp[3]);
      }
      console[type](
        format(
          "%s %s %s:%s %s",
          levels[level].toString().toUpperCase(),
          new Date().toISOString(),
          basename(stack.path),
          stack.line,
          msg
        )
      );
    } else {
      console[type](format("%s %s %s", levels[level].toString().toUpperCase(), new Date().toISOString(), msg));
    }
  };

  return {
    level: (level) => {
      let l;
      if ((l = levels.indexOf(level)) >= 0) {
        logLevel = l;
        log("debug", 1, "set log level " + level);
      }
    },
    debug: (firstArg, ...rest) => {
      if (shouldLogging(1)) {
        log("debug", 1, format(firstArg, ...rest));
      }
    },
    info: (firstArg, ...rest) => {
      const level = 2;
      if (shouldLogging(level)) {
        log("info", level, format(firstArg, ...rest));
      }
    },
    warn: (firstArg, ...rest) => {
      const level = 3;
      if (shouldLogging(level)) {
        log("warn", level, format(firstArg, ...rest));
      }
    },
    error: (firstArg, ...rest) => {
      const level = 4;
      if (shouldLogging(level)) {
        log("error", level, format(firstArg, ...rest));
      }
    },
  };
})();
