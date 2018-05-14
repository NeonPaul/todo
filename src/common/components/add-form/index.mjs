import withCss from '../../mixins/with-css'
import bemHelper from '../../utils/bem-helper'

const css = '/common/components/add-form/css.css';

const bem = bemHelper('AddForm')

export default {
  template: `
<form action="add" method="post" autocomplete="off" class="${bem()}">
  <input name="title" autofocus>
  <textarea name="note" class="${bem('textarea')}"></textarea>
  <button class="${bem('button')}">Ok</button>
</form>
`,
  mixins: [withCss(css)]
}