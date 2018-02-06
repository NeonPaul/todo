const marked = require("marked");
const status = require('../status')
const withCss = require('../mixins/with-css')

module.exports = {
  mixins: [withCss(`
  .Item {
    display: flex;
    align-items: flex-start;
  }
  
  .Item__move {
    margin: 5px 0;
  }

  .Item__move form {
    margin: 0;
  }

  .Item__move form button {
    font-size: 50%;
  }
  `)],
  props: ['i', 'pt', 'nt'],
  computed: {
    noteMd() {
      return marked(this.i.note)
    }
  },
  template: `
  <div class="Item">
    <form :action="'/'+i.id" method="post">
      <button>x</button>
    </form>
    <div class="Item__move">
      <form action="/order" method="post">
        <button :disabled="!pt">▲</button>
        <input type="hidden" name="set" :value="i.id+'='+(i.weight - 1)">
        <input type="hidden" name="set" :value="(pt && pt.id) + '=' + (pt &&
  pt.weight + 1)">
      </form>
      <form action="/order" method="post">
        <button :disabled="!nt">▼</button>
        <input type="hidden" name="set" :value="i.id + '=' + (i.weight + 1)">
        <input type="hidden" name="set" :value="(nt && nt.id) + '=' + (nt &&
  nt.weight - 1)">
      </form>
    </div>
    <details v-if="i.note">
      <summary>{{ i.title }}</summary>
      <div v-html="noteMd"></div>
    </details>
    <template v-else>
      {{ i.title }}
    </template>
    <details>
      <summary>Edit</summary>
      <form :action="'/edit/' + i.id" method="post" autocomplete="off">
        <input name=title :value="i.title"><br>
        <textarea name=note>{{i.note}}</textarea><br>
        <select name="status" v-model="i.status">
          <option :value="${status.NEXT}">Next</option>
          <option :value="${status.SOMEDAY}">Someday</option>
          <option :value="${status.WAITING}">Waiting</option>
        </select><br>
        <button>Save</button>
      </form>
    </details>
  </div>`
  }