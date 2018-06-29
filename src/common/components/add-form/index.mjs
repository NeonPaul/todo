import withCss from '../../mixins/with-css'
import bemHelper from '../../utils/bem-helper'

const css = '/common/components/add-form/css.css';

const bem = bemHelper('AddForm')

const { searchParams } = typeof window === 'object' ? new URL(window.location.toString()) : {
  searchParams: { get(){} }
};

const title = searchParams.get('title') || '';
const description = searchParams.get('description') || '';
const url = searchParams.get('url') || '';

export default {
  data: () => ({
    title,
    note: [description, url].filter(Boolean).join('\n')
  }),
  template: `
<form action="add" method="post" autocomplete="off" class="${bem()}">
  <input name="title" :value="title" autofocus>
  <textarea name="note" class="${bem('textarea')}">{{ note }}</textarea>
  <button class="${bem('button')}">Ok</button>
</form>
`,
  mixins: [withCss(css)]
}