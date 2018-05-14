const cssData = css => `data:text/css,${encodeURIComponent(css)}`;

module.exports = css => ({
  inject: ["insertCss"],
  created() {
    this.insertCss(css);
  }
})

module.exports.data = css => module.exports(cssData(css))