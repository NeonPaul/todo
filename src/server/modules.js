const path = require('path');
const express = require('express');
const fs = require('fs');
const ST = require('stream-template');

const router = express.Router();

// Modules generally not designed for esm-browser use and are all
// packaged differently, so manip them individually

const modWrap = file => (req, res, next) => {
  // This is a cjs module so we have to convert to esm with some
  // gross hacky-hacks
  res.set('Content-Type', 'application/javascript');

  const marked = fs.createReadStream(file);

  const output = ST`
    const exports = {};
    const module = { exports };

    ${marked}

    export default module.exports;
    `;
  output.pipe(res);
  output.on('error', next);
}

// Serve marked
router.get('/marked', (req, res, next) => {
  modWrap(require.resolve('marked/lib/marked.js'))(req, res, next);
})

  // Serve vue lib
  router.get('/vue', (req, res) => {
    // Todo: Use the runtime version
    // - requires template pre-compilation (or use JSX?)
    res.sendFile(require.resolve('vue/dist/vue.esm.js'));
  })

  router.get('/vuex', (req, res) => {
    const pkg = require.resolve('vuex/package.json');
    const {module} = require(pkg);
    res.sendFile(path.resolve(pkg, '..', module))
  })

router.get('/@shopify/draggable', (req, res, next) => {
  const pkg = require.resolve('@shopify/draggable/package.json');
  const {main} = require(pkg);
  modWrap(path.resolve(pkg, '..', main))(req, res, next);
})

module.exports = router;
