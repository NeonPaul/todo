import withCss from '../mixins/with-css';
import Items from './items';
import AddForm from './add-form';
import Menu from './menu';
import Viewport from './viewport';
import bemHelper from '../utils/bem-helper';
import { dragBus } from '../mixins/draggable';

const cls = bemHelper('Index')

export default {
    components: {
      AddForm,
      Items,
      Menu,
      Viewport
    },
    props: ['items', 'status'],
    data() {
      return {
        peak: false
      };
    },
    template: `<div class=${cls()} id="app">
    <Viewport :peak="peak">
      <Menu slot="drawer"/>
      <div class="${cls('top')}" slot="heading">
      <details>
        <summary>Add</summary>
        <Add-Form />
      </details>
    </div>
      <div class=${cls('main')}>
        <Items :items="items" :status="status" />
      </div>
      </Viewport>
    </div>`,
    mounted(){
      dragBus.$on('dragstart', () => this.peak = true);
      dragBus.$on('dragend', () => this.peak = false);
    },
    mixins: [withCss.data(`
      body{
        margin: 0;
        font-family:sans-serif;
      }

      .Index {
        width: -moz-max-content;
        margin: auto;
        max-width: 100%;
        display: flex;
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
