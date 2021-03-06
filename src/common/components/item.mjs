import marked from "/~/marked"
import status from '../status'
import withCss from '../mixins/with-css'
import bemHelper from '../utils/bem-helper'
import Move from './move'
import Button from './button'

const bem = bemHelper('Item')

export default {
  mixins: [withCss.data(`
  .Item {
    display: flex;
    align-items: flex-start;
    background: #EEE;
  }

  .Item.draggable--over {
    border-bottom: 5px solid black;
  }

  .Item.draggable-mirror {
    opacity: 0.5;
  }

  .Item:nth-child(odd) {
    background: #F7F7F7;
  }

  .Item > * {
    padding: 0.5em;
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

  .Item__title {
    flex-grow: 1;
    word-wrap: break-word;
    min-width: 0;
  }
  `)],
  props: ['i', 'first', 'last', 'status', 'hideMoveForm'],
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
    <Move v-if="!hideMoveForm" :item="i" :up="!first" :down="!last" :status="status" />
    <details v-if="i.note" class="${bem('note')} ${bem('title')}">
      <summary>{{ i.title }}</summary>
      <div v-html="noteMd" class="${bem('note-contents')}"></div>
    </details>
    <div class="${bem('title')}" v-else>
      {{ i.title }}
    </div>
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
