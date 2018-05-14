const withCss = require('../mixins/with-css')
const bemHelper = require('../utils/bem-helper')
const Button = require('./button')

const bem = bemHelper('Move')

module.exports = {
  mixins: [withCss.data(`
  .Move {
    margin-top: -0.25em;
  }

  .Move form {
    margin: 0;
  }
  `)],
  components: {
    Button
  },
  props: ['item', 'up', 'down', 'status'],
  template: `
<div class="${bem()}">
<form action="/move" method="post">
  <Button :disabled="!up" cls="${bem('ctl')}">
    <svg viewbox="0 0 4 2.5">
      <path d="M 1,2 L2,1 L3,2" stroke="currentColor" stroke-width="0.6" fill="none" />
    </svg>
  </Button>
  <input type="hidden" name="status" :value="status">
  <input type="hidden" name="id" :value="item.id">
  <input type="hidden" name="position" value="-1" />
</form>
<form action="/move" method="post">
  <Button :disabled="!down" class="${bem('ctl')}">
    <svg viewbox="0 0 4 2.5">
      <path d="M 1,0.5 L2,1.5 L3,0.5" stroke="currentColor" stroke-width="0.6" fill="none" />
    </svg>
  </Button>
  <input type="hidden" name="status" :value="status">
  <input type="hidden" name="id" :value="item.id">
  <input type="hidden" name="position" value="1" />
</form>
</div>`}