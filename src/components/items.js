const Item = require('./item')

module.exports = {
  props: ['items'],
  components: {
    Item
  },
  template: `<div><template v-for="item in items">
    <Item v-bind="item"/><br>
  </template></div>`
}