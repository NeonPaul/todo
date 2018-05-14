const withCss = require('../../mixins/with-css')
const bemHelper = require('../../utils/bem-helper')

const bem = bemHelper('AddForm')

module.exports = import('./css.css').then(css => ({
  template: `
<form action="add" method="post" autocomplete="off" class="${bem()}">
  <input name="title" autofocus>
  <textarea name="note" class="${bem('textarea')}"></textarea>
  <button class="${bem('button')}">Ok</button>
</form>
`,
  mixins: [withCss(css.default)]
}));
