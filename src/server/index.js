const express = require("express");
const jose = require('node-jose');
const Vue = require("vue");
const cookie = require('cookie');
const path = require('path');

const app = express();

// Set up environment variables
const { CLIENT_ID, SECRET, PORT, JWE_KEY } =
  process.env.NODE_ENV === 'PRODUCTION' ?
    process.env :
    {
      ...(() => {
        try {
          return require('../env.js')
        } catch(e) {
          return {};
        }
      })(),
      ...process.env
    };

if (!CLIENT_ID || !SECRET) {
  throw new Error(
    "Please create src/env.js using details from http://api.toodledo.com/3/account/doc_register.php"
  );
}

// OAuth things
// TODO: Improve this
const state = (Math.random() * 10 ** 17).toString(16);

// Import jwe key
// TODO: Don't run express until this promise
let key;
jose.JWK.asKey(JWE_KEY).then(k => { key = k });


const Index = import('../common/components/index')
const renderer = require("vue-server-renderer").createRenderer();
const Toodledo = require('./toodledo');
const cookieKey = 'auth';

// Serve common & client modules
const static = ['common', 'client']

static.forEach(dir => {
  app.use(`/${dir}`, express.static(path.join(__dirname, '..', dir), {
    extensions: ['mjs'],
    index: 'index.mjs'
  }))
})

// In these entries we designate /~/ to refer to node_modules
app.use('/~', require('./modules'));

// Do the auth stuff and set up toodledo client
// Todo: Make this better
app.use(async (req, res, next) => {
  try {
    const enc = cookie.parse(req.headers.cookie || '')[cookieKey];
    let auth;

    const setCookie = async (auth) => {
      const encAuth = JSON.stringify(await jose.JWE.createEncrypt(key).update(JSON.stringify(auth)).final())

      res.setHeader('Set-Cookie', cookie.serialize(cookieKey, encAuth, {
        maxAge: 60 * 60 * 24 * 30
      }));
    }

    if(enc) {
      try {
        const c = JSON.parse(enc);

        const result = await jose.JWE.createDecrypt(key).decrypt(c);

        auth = JSON.parse(result.plaintext);

      } catch(e) {
        console.log(e.stack)
      }
    }

    const toodledo = new Toodledo(CLIENT_ID, SECRET);

    await toodledo.authorise(auth, setCookie);

    req.toodledo = toodledo;

    next();
  } catch(e) {
    next(e);
  }
})

// Serve app index
app.get("/", async (req, res, next) => {
  try {
    if (!req.toodledo.accessToken) {
      const { code } = req.query;

      if (!code) {
        res.redirect(req.toodledo.getAuthUrl(["basic", "tasks", "write"], state));
        return;
      }

      await req.toodledo.getAccessToken(code, state);

      res.redirect("/");
      return;
    }

    const css = new Set();

    const getItems = s => req.toodledo.getTasks(["note", "status", "tag"], s);
    const status = req.query.status || 0;
    const items = await getItems(status)

    const app = (Index => new Vue({
      provide() {
        return {
          insertCss(...styles) {
            styles.forEach(s => css.add(s));
          }
        };
      },
      render: h => h(Index, { props: { items, status }})
    }))((await Index).default);

    const body = await renderer.renderToString(app);

    const html = `<!doctype html -->
<html>
  <head>
    <meta charset="utf-8">
    <title>Todo</title>
    <link rel="manifest" href="client/webmanifest.webmanifest">
    <script>
    window.process = {
      env: {
        NODE_ENV: "${process.env.NODE_ENV}"
      }
    };
    window.vueCx = ${JSON.stringify({ items, status })};
    </script>
    <script src="client/main.js" type="module"></script>
    ${Array.from(css)
      .map(url => `<link rel=stylesheet href="${url}">`)
      .join("\n")}
  </head>
  <body>
  ${body}
  </body>
</html>`;

    res.send(html);
  } catch (e) {
    next(e);
  }
});

app.use(require('./api'))

// Start
app.listen(PORT, () => {
  console.log("http://localhost:" + PORT);
});
