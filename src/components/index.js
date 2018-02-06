const status = require('../status')
const withCss = require('../mixins/with-css')
const Items = require('./items')
const AddForm = require('./add-form')

module.exports = {
    components: {
      AddForm,
      Items
    },
    props: ['items'],
    template: `<body>
      <a href="/">Next</a> |
      <a href="?status=${status.SOMEDAY}">Someday</a> |
      <a href="?status=${status.WAITING}">Waiting</a>
    <Add-Form /><Items :items="items" /></body>`,
    mixins: [withCss(`
      body{
        font-family:sans-serif;
      }
    `)]
  };