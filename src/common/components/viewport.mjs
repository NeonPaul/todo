import withCss from '../mixins/with-css';
import bemHelper from '../utils/bem-helper';

const bem = bemHelper('Viewport')

export default ({
  template: `
    <div class="${bem()}" :data-drawer="drawer">
      <div class="${bem('cover')}" @click="drawer=false"></div>
      <div class="${bem('drawer')}">
        <slot name="drawer"></slot>
      </div>
      <div class="${bem('main')}">
        <div class="${bem('heading')}">
          <button @click="drawer=true">Menu</button>
          <slot name="heading"></slot>
        </div>
        <slot></slot>
      </div>
    </div>
  `,
  data(){
    return {
      drawer: false
    };
  },
  methods: {
    openMenu(){
      this.drawer = true;
    }
  },
  mixins: [withCss.data(`
  .Viewport {
    width: 100%;
    height: 100%;
  }

  [data-drawer] .Viewport__cover {
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    position: absolute;
  }

  .Viewport__drawer {
    position: absolute;
    height: 100%;
    transform: translateX(-100%);
    transition: transform cubic-bezier(.20,0,.10,1) 300ms;
  }

  [data-drawer] .Viewport__drawer {
    transform: translateX(0);
  }

  .Viewport__heading {
    display: flex;
  }
  `)]
});
