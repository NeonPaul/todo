# Todogong

A little todo experiment.

## Installing & Running

Requires **node version 10**.

    npm install

### Env vars

Either make sure the environment variables are defined: CLIENT_ID, SECRET, PORT, JWE_KEY.

Or you need to manually create the `src/env.js` file:

```js
    module.exports = {
        clientId: '...',
        secret: '...',
        port: 8080,
        jweKey: '...'
    }
```

The jweKey should be set to the output you get from running the keygen:

    npm run kegen

The entire json object that the script outputs is the key.

### Run

Start with npm:

   npm start