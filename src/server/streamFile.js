const fs = require('fs');

const streamFile = (file, opts) => (req, res, next) => {
  if (typeof file === 'function') {
    file = file(req, res)
  }

  const stream = fs.createReadStream(file);
  stream.on('error', e => {
    console.log(e);
    next(new Error('File not found'));
  });
  stream.pipe(res, opts);
  return stream;
}

module.exports = streamFile;