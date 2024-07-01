/**
 * © Copyright restclients. 2024 All Rights Reserved
 *   Project name: restclients
 *   This project is licensed under the Apache 2 License, see LICENSE
 */

let populateVars = (vars, key, value, valueVars) => {
  let n = valueVars.length - 1;
  for (let i = 0; i < n; ++i, i += 2) {
    let key = valueVars[i+1];
    value.replaceAll(valueVars[i], )
  }
};

// post-parse stage
// the purpose of evalutor is to add as much semantic value to the exprs as possible
const evaluator = function (exprs, vars) {
  vars = Object.assign({}, vars);

  exprs.map((item) => {
    if (!item.error) {
      switch (item.type) {
        case varType: {
          const key = item.value[0];
          const value = item.value[1];
          const valueVars = item.value[item.value.length - 1];

          if (key && value && valueVars instanceof Array && valueVars.length > 0) {
            
          }
        }
      }
    }
  });
};
