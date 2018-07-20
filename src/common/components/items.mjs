import Item from './item';
import Draggable from '/~/vuedraggable';

export default {
  props: ['items', 'status'],
  inject: ["dispatch"],
  components: {
    Item,
    Draggable
  },
  methods: {
    change(obj) {
      this.dispatch({
        type: 'MOVE',
        payload: obj.moved
      })
    }
  },
  template: `<div><draggable :value="items" @change="change" :options="{ filter: 'textarea, input, button, select', preventOnFilter: false }">
    <Item v-for="(item, index) in items" :key="item.id" :i="item" :status="status" :first="index === 0" :last="index === items.length - 1"/><br>
  </draggable></div>`
}
