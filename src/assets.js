const path = require('path');
const base = __dirname;

module.exports = {
  toFile(url) {
    return path.join(base, url);
  },

  toUrl(file) {
    return path.resolve('/', path.relative(base, file))
  }
}