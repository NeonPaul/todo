import Index from '../common/components/index.mjs';
import Vue from '/~/vue'
import Vuex from '/~/vuex'

document.body.classList.add('has-js');

Vue.use(Vuex);

const { items, status } = window.vueCx;

const store = new Vuex.Store({
  state: {
    items, status
  },
  mutations: {
    setItems (state, items) {
      state.items = items;
    },
    setStatus (state, status) {
      state.status = status;
    }
  }
})

// TODO: Replace this with redux & optimistic changes
const dispatch = function (action) {
  switch (action.type) {
    case 'MOVE':
      const items = store.state.items;
      const moved = items.slice();

      const { oldIndex, newIndex } = action.payload;
      const dir = Math.sign(newIndex - oldIndex)

      const newList = items.slice();
      const updates = [];

      const sort = (oldIx, newIx) => {
        const id = items[oldIx].id;
        const weight = items[oldIx].weight + items[newIx].order - items[oldIx].order;
        updates.push({ id, weight })
        newList[newIx] = items[oldIx];
      }

      sort(oldIndex, newIndex)

      for (let i = oldIndex + dir; (i * dir) <= (newIndex * dir); i += dir) {
        sort(i, i - dir);
      }

      store.commit('setItems', newList);

      const form = new FormData();
      form.append('json', JSON.stringify(updates));

      // Todo: Switch to using tokens
      fetch('/update', {
        method: 'POST',
        body: form,
        credentials: "same-origin"
      })
  }
}

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
