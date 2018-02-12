const status = require('../status')
const withCss = require('../mixins/with-css')
const Items = require('./items')
const AddForm = require('./add-form')

const cls = (sub) => {
  const clsName = 'Index'

  return sub ? `${clsName}__${sub}` : clsName;
}

module.exports = {
    components: {
      AddForm,
      Items
    },
    props: ['items'],
    template: `<body class=${cls()}>
      <ul class="${cls('sidebar')}">
        <li><a href="/">Next</a></li>
        <li><a href="?status=${status.SOMEDAY}">Someday</a></li>
        <li><a href="?status=${status.WAITING}">Waiting</a></li>
      </ul>
      <div class="${cls('main')}">
        <Add-Form /><Items :items="items" />
      </div>
    </body>`,
    mixins: [withCss(`
      body{
        margin: 0;
        font-family:sans-serif;
      }

      .Index {
        display: flex;
      }

      .Index__sidebar {
        list-style: none;
        padding: 0;
        margin: 0;
        background: #eee;
      }

      .Index__sidebar a:link,
      .Index__sidebar a:visited {
        display: block;
        color: black;
        text-decoration: none;
        font-size: 0.7em;
        padding: 0.5em;
      }

      .Index__sidebar a:hover {
        text-decoration: underline;
      }

      .Index__main {
        padding: 0.5em;
      }
    `)]
  };