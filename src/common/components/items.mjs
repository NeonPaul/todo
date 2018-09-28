import Item from './item';
import { mixins } from '../mixins/draggable';

export default {
  props: ['items', 'status'],
  inject: ["dispatch"],
  data(){
    return { componentMounted: false };
  },
  components: {
    Item
  },
  mixins:[mixins.dropTarget],
  methods: {
    change(obj) {
      this.dispatch({
        type: 'MOVE',
        payload: obj.moved
      })
    }
  },
  mounted(){
    this.$on('over', ([ oldItem, newItem ]) => {
      if (newItem) {
        this.change({
          moved: {
            oldIndex: oldItem.index,
            newIndex: newItem.index
          }
        })
      }
    });
  },
  async mounted() {
    this.componentMounted = true;
  },
  template: `<div class="Items">
    <Item v-for="(item, index) in items" v-draggable="{ item, index }" :key="item.id" :i="item" :status="status" :first="index === 0" :last="index === items.length - 1" :hideMoveForm="componentMounted"/><br>
  </div>`
}
