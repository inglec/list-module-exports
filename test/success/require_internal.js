module.exports = ['fs', 'path'].reduce((acc, name) => {
  // eslint-disable-next-line
  acc[name] = require(name);
  return acc;
}, {});
