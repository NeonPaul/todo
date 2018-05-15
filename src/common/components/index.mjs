import status from '../status';
import withCss from '../mixins/with-css';
import Items from './items';
import AddForm from './add-form';
import bemHelper from '../utils/bem-helper';

const cls = bemHelper('Index')

export default {
    components: {
      AddForm,
      Items
    },
    props: ['items', 'status'],
    template: `<div class=${cls()} id="app">
      <ul class="${cls('sidebar')}">
        <li><a href="/">Next</a></li>
        <li><a href="?status=${status.SOMEDAY}">Someday</a></li>
        <li><a href="?status=${status.WAITING}">Waiting</a></li>
      </ul>
      <div class="${cls('main')}">
        <Add-Form /><Items :items="items" :status="status" />
      </div>
    </div>`,
    mixins: [withCss.data(`
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
