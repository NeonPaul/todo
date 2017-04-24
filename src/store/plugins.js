import { STORAGE_KEY, mutationTypes } from './mutations'
import createLogger from 'vuex/src/plugins/logger'

const AUTH_KEY = 'authKey'

const localStoragePlugin = store => {
  var authToken = window.localStorage.getItem(AUTH_KEY)
  if (authToken) {
    store.commit(mutationTypes.SET_AUTH, { token: authToken })
  }

  store.subscribe((mutation, { todos }) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))

    if (mutation.type === mutationTypes.SET_AUTH) {
      window.localStorage.setItem(AUTH_KEY, mutation.payload.token)
    }
  })
}

export default process.env.NODE_ENV !== 'production'
  ? [createLogger(), localStoragePlugin]
  : [localStoragePlugin]
