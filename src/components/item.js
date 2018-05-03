const marked = require("marked");
const status = require('../status')
const withCss = require('../mixins/with-css')
const bemHelper = require('../utils/bem-helper')
const Move = require('./move')
const Button = require('./button')

const bem = bemHelper('Item')

module.exports = {
  mixins: [withCss(`
  .Item {
    display: flex;
    align-items: flex-start;
  }

  .Item__complete svg {
    width: 1.5em;
  }

  .Item button:hover:not(:disabled) {
    opacity: 1;
    cursor: pointer;
  }

  .Item__note[open] {
    border: 1px solid #ccc;
  }

  .Item__note-contents {
    background: #eee;
    padding: 0.5em;
  }

  .Item__note-contents > :first-child {
    margin-top: 0;
  }

  .Item__note-contents > :last-child {
    margin-bottom: 0;
  }

  .Item__edit form > * {
    display: block;
    width: 100%;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin: 0;
    padding: 0.5em;
  }

  .Item__edit textarea {
    width: 100em;
    height: 20em;
  }

  .Item__edit summary {
    cursor: pointer;
  }
  `)],
  props: ['i', 'first', 'last', 'status'],
  computed: {
    noteMd() {
      return marked(this.i.note)
    }
  },
  components: {
    Move,
    Button
  },
  template: `
  <div class="Item">
    <form :action="'/'+i.id" method="post" class="${bem('complete')}">
      <Button cls="Item__ctl">
        <svg viewbox="0 0 4 4">
          <path d="M 1,1 L 3,3 M 3,1 L 1,3" stroke="currentColor" stroke-width="0.6" />
        </svg>
      </Button>
    </form>
    <Move :item="i" :up="!first" :down="!last" :status="status" />
    <details v-if="i.note" class="${bem('note')}">
      <summary>{{ i.title }}</summary>
      <div v-html="noteMd" class="${bem('note-contents')}"></div>
    </details>
    <template v-else>
      {{ i.title }}
    </template>
    <details class="Item__edit">
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