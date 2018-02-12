const withCss = require('../mixins/with-css')
const bemHelper = require('../utils/bem-helper')

const bem = bemHelper('AddForm')

module.exports = {
  template: `
<form action="add" method="post" autocomplete="off" class="${bem()}">
  <input name="title" autofocus>
  <textarea name="note" class="${bem('textarea')}"></textarea>
  <button class="${bem('button')}">Ok</button>
</form>
`,
  mixins: [withCss(`
    .AddForm {
      display: block;
      font-size: 0.75em;
      margin-top: -0.5em;
      width: 100%;
      transition: width 300ms;
    }

    .AddForm:not(:focus-within) {
      width: 18em;
    }

    .AddForm > * {
      display: block;
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 5px;
      margin: 0.5em 0;
      padding: 0.5em;
    }

    .AddForm__button {
      cursor: pointer;
    }

    .AddForm__textarea {
      height: 8em;
      transition: height 300ms;
    }

    .AddForm:not(:focus-within) .AddForm__textarea {
      height: 4em;
    }
  `)]
};