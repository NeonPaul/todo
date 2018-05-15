import Index from '../common/components/index.mjs';
import Vue from '/~/vue'

const { items, status } = window.vueCx;

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
        }
      };
    },
    render: h => h(Index, { props: { items, status }})
  });

app.$mount('#app');