const R = require('ramda');

// https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object
const renameKeys = R.curry((keysMap, obj) => {
  return R.reduce((acc, key) => {
    acc[keysMap[key] || key] = obj[key];
    return acc;
  }, {}, R.keys(obj));
});

module.exports = {renameKeys};
