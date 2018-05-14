const cssData = css => `data:text/css,${encodeURIComponent(css)}`;

const cssMixin = css => ({
  inject: ["insertCss"],
  created() {
    this.insertCss(css);
  }
})

cssMixin.data = css => cssMixin(cssData(css))

export default cssMixin;