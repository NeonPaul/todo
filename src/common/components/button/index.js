const withCss = require('../../mixins/with-css')
const bemHelper = require('../../utils/bem-helper')
const cls = (...classes) => classes.filter(Boolean).join(' ');

const bem = bemHelper('Button')

module.exports = {
  mixins: [withCss.data(`
  .Button svg {
    width: 1.5em;
  }

  .Button {
    background: transparent;
    border: none;
    opacity: 0.5;
    padding: 0;
  }

  .Button:disabled {
    opacity: 0.3;
  }
  `)],
  props: ['cls'],
  render: function (h) {
    return h(
      'button',
      {
        attrs: this.$attrs,
        class: cls(bem(), this.$props.cls)
      },
      this.$slots.default
    )
  }
}