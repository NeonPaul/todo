const marked = require("marked");
const status = require('../status')
const withCss = require('../mixins/with-css')
const bemHelper = require('../utils/bem-helper')

const bem = bemHelper('Item')

module.exports = {
  mixins: [withCss(`
  .Item {
    display: flex;
    align-items: flex-start;
  }

  .Item__move svg {
    width: 1.5em;
  }

  .Item__move {
    margin-top: -0.25em;
  }

  .Item__move form {
    margin: 0;
  }

  .Item button {
    background: transparent;
    border: none;
    opacity: 0.5;
    padding: 0;
  }

  .Item button:disabled {
    opacity: 0.3;
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
  `)],
  props: ['i', 'pt', 'nt'],
  computed: {
    noteMd() {
      return marked(this.i.note)
    }
  },
  template: `
  <div class="Item">
    <form :action="'/'+i.id" method="post" class="${bem('complete')}">
      <button>
        <svg viewbox="0 0 4 4">
          <path d="M 1,1 L 3,3 M 3,1 L 1,3" stroke="currentColor" stroke-width="0.6" />
        </svg>
      </button>
    </form>
    <div class="Item__move">
      <form action="/order" method="post">
        <button :disabled="!pt">
          <svg viewbox="0 0 4 2.5">
            <path d="M 1,2 L2,1 L3,2" stroke="currentColor" stroke-width="0.6" fill="none" />
          </svg>
        </button>
        <input type="hidden" name="set" :value="i.id+'='+(i.weight - 1)">
        <input type="hidden" name="set" :value="(pt && pt.id) + '=' + (pt &&
  pt.weight + 1)">
      </form>
      <form action="/order" method="post">
        <button :disabled="!nt">
          <svg viewbox="0 0 4 2.5">
            <path d="M 1,0.5 L2,1.5 L3,0.5" stroke="currentColor" stroke-width="0.6" fill="none" />
          </svg>
        </button>
        <input type="hidden" name="set" :value="i.id + '=' + (i.weight + 1)">
        <input type="hidden" name="set" :value="(nt && nt.id) + '=' + (nt &&
  nt.weight - 1)">
      </form>
    </div>
    <details v-if="i.note" class="${bem('note')}">
      <summary>{{ i.title }}</summary>
      <div v-html="noteMd" class="${bem('note-contents')}"></div>
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