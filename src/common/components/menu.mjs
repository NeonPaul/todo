import status from '../status';
import withCss from '../mixins/with-css';
import bemHelper from '../utils/bem-helper';

const cls = bemHelper('Menu')

export default {
  template: `<div class="${cls()}">
    <li><a href="/">Next</a></li>
    <li><a href="?status=${status.SOMEDAY}">Someday</a></li>
    <li><a href="?status=${status.WAITING}">Waiting</a></li>
  </div>`,
  mixins: [withCss.data(`
    .Menu {
      height: 100%;
      background: white;
    }
  `)]
  };
