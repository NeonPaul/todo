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
      <div class="${cls('top')}">
        <details>
          <summary>Menu</summary>
          <ul class="${cls('sidebar')}">
            <li><a href="/">Next</a></li>
            <li><a href="?status=${status.SOMEDAY}">Someday</a></li>
            <li><a href="?status=${status.WAITING}">Waiting</a></li>
          </ul>
        </details>
        <details>
          <summary>Add</summary>
          <Add-Form />
        </details>
      </div>
      <Items :items="items" :status="status" />
    </div>`,
    mixins: [withCss.data(`
      body{
        margin: 0;
        font-family:sans-serif;
      }

      .Index {
        width: -moz-max-content;
        margin: auto;
        max-width: 100%;
      }

      .Index__top {
        display: flex;
      }

      .Index__sidebar {
        position: absolute;
        list-style: none;
        padding: 0;
        margin: 0;
        background: #eee;
        z-index: 1;
      }

      .Index__sidebar a:link,
      .Index__sidebar a:visited {
        display: block;
        color: black;
        text-decoration: none;
        padding: 0.5em;
      }

      .Index__sidebar a:hover {
        background: #FFC;
      }
    `)]
  };
