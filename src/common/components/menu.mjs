import { directives } from '../mixins/draggable';
import status from '../status';
import withCss from '../mixins/with-css';
import bemHelper from '../utils/bem-helper';

const cls = bemHelper('Menu')

export default {
  template: `<ul class="${cls()}">
    <li v-for="status in statuses" v-drop-target="drop(status[0])"><a :href="'/?status=' + status[0]">{{ status[1] }}</a></li>
  </ul>`,
  inject: ["dispatch"],
  directives: {
    dropTarget: directives.dropTarget
  },
  data() {
    return {
      statuses: [
        [status.NEXT, 'Next'],
        [status.SOMEDAY, 'Someday'],
        [status.WAITING, 'Waiting'],
      ]
    }
  },
  methods: {
    drop(status){
      return item => {
        const id = item.item.id;

        fetch('/status', {
          method: 'POST',
          body: JSON.stringify({
            id,
            status
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: "same-origin"
        });

        this.dispatch({
          type: 'REMOVE_ITEM',
          id
        });
      }
    }
  },
  mixins: [withCss.data(`
    .Menu {
      height: 100%;
      background: white;
    }

    .Menu li {
      display: block;
      padding: 0.5em;
    }

    .Menu li.draggable-container--over {
      background: #FFC;
      outline: 2px solid black;
    }
  `)]
  };
