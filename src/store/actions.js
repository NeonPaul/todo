import { mutationTypes } from './mutations'

const host = 'https://shack-neonpaul.rhcloud.com'

const api = {
  logIn: details =>
    fetch(
      `${host}/api/auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(details)
      }
    )
    .then(r => r.json())
    .then(json => json.token)
}

export default {
  logIn: ({ commit }, details) => {
    api.logIn(details)
       .then(token => commit(mutationTypes.SET_AUTH, { token }))
  }
}
