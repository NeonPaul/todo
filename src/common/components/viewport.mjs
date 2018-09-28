import withCss from '../mixins/with-css';
import bemHelper from '../utils/bem-helper';

const bem = bemHelper('Viewport')

export default ({
  template: `
    <div class="${bem()}" :data-drawer="drawer">
      <div class="${bem('cover')}" @click="drawerOpen=false"></div>
      <div class="${bem('drawer')}">
        <slot name="drawer"></slot>
      </div>
      <div class="${bem('main')}">
        <div class="${bem('heading')}">
          <button @click="drawerOpen=true">Menu</button>
          <slot name="heading"></slot>
        </div>
        <slot></slot>
      </div>
    </div>
  `,
  data(){
    return {
      drawerOpen: false
    };
  },
  props: ['peak'],
  methods: {
    openMenu(){
      this.drawerOpen = true;
    }
  },
  computed:{
    drawer() {
      return (this.drawerOpen && 'open') || (this.peak && 'peak');
    }
  },
  mixins: [withCss.data(`
  .Viewport {
    width: 100%;
    height: 100%;
  }

  [data-drawer=open] .Viewport__cover {
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


  [data-drawer=peak] .Viewport__drawer {
    transform: translateX(-50%);
  }


  [data-drawer=peak] .Viewport__drawer:hover,
  [data-drawer=open] .Viewport__drawer {
    transform: translateX(0);
  }

  .Viewport__heading {
    display: flex;
  }
  `)]
});
