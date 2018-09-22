import Item from './item';
import Draggable from '/!/@shopify/draggable';

const { Sortable } = Draggable;

export default {
  props: ['items', 'status'],
  inject: ["dispatch"],
  data(){
    return { componentMounted: false };
  },
  components: {
    Item
  },
  methods: {
    change(obj) {
      this.dispatch({
        type: 'MOVE',
        payload: obj.moved
      })
    }
  },
  async mounted() {
    this.sortable = new Sortable(this.$el, {
      draggable: '.Items > *'
    })
    this.sortable.on('drag:start', (e) => {
      if(e.data.sensorEvent.data.target.tagName.match(/input|textarea|button|select/i)){
        e.cancel();
      }
    });
    this.sortable.on('sortable:stop', (e) => {
      if(e.data.oldIndex !== e.data.newIndex) {
        this.change({ moved: e.data });
      }
    });
    this.componentMounted = true;
  },
  template: `<div class="Items">
    <Item v-for="(item, index) in items" :key="item.id" :i="item" :status="status" :first="index === 0" :last="index === items.length - 1" :hideMoveForm="componentMounted"/><br>
  </div>`
}
