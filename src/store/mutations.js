export const STORAGE_KEY = 'todos-vuejs'
const AUTH_KEY = 'todo-auth'

// for testing
if (navigator.userAgent.indexOf('PhantomJS') > -1) {
  window.localStorage.clear()
}

export const state = {
  auth: null,
  todos: JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
}

export const getters = {
  loggedIn (state) {
    return !!state.auth
  }
}

export const mutationTypes = {
  SET_AUTH: 'setAuth'
}

export const mutations = {
  setAuth (state, { token }) {
    state.auth = token
  },

  addTodo (state, { text }) {
    state.todos.push({
      text,
      done: false
    })
  },

  deleteTodo (state, { todo }) {
    state.todos.splice(state.todos.indexOf(todo), 1)
  },

  toggleTodo (state, { todo }) {
    todo.done = !todo.done
  },

  editTodo (state, { todo, value }) {
    todo.text = value
  },

  toggleAll (state, { done }) {
    state.todos.forEach((todo) => {
      todo.done = done
    })
  },

  clearCompleted (state) {
    state.todos = state.todos.filter(todo => !todo.done)
  }
}
