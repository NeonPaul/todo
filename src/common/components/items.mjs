import Item from './item';

export default {
  props: ['items', 'status'],
  components: {
    Item
  },
  template: `<div><template v-for="(item, index) in items">
    <Item :i="item" :status="status" :first="index === 0" :last="index === items.length - 1"/><br>
  </template></div>`
}