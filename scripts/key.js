const jose = require('node-jose');

const keystore = jose.JWK.createKeyStore();

keystore.generate("oct", 256).then(key => {
  console.log(JSON.stringify(key.toJSON(true)))
})