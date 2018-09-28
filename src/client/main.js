import Index from '../common/components/index.mjs';
import Vue from '/~/vue'
import { dispatch, store } from './store.js';

document.body.classList.add('has-js');

const app = new Vue({
    provide() {
      return {
        insertCss(...styles) {
          styles.forEach(s => {
            const link = document.createElement('link');
            link.rel = "stylehseet";
            link.href = s;
            document.head.appendChild(link);
          });
        },

        dispatch
      };
    },
    data: {
      status
    },
    computed: {
      items() {
        return store.state.items;
      }
    },
    render(h) {
      const { items, status } = this;
      return h(Index, { props: { items, status }})
    }
  });

app.$mount('#app');
