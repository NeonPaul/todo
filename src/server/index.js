const express = require("express");
const parseFormData = require("isomorphic-form/dist/server");
const jose = require('node-jose');
const Vue = require("vue");
const cookie = require('cookie');
const path = require('path');
const assets = require('../assets');
const streamFile = require('./streamFile')

const app = express();

// Set up environment variables
try {
  const { clientId, secret, port, jweKey } = require("../env.js");
  var env = {
    CLIENT_ID: clientId,
    SECRET: secret,
    PORT: port,
    JWE_KEY: jweKey,
    ...process.env
  };
} catch (e) {
  var env = process.env;
}

const { CLIENT_ID, SECRET, PORT, JWE_KEY } = env;

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

// Serve css assets
// TODO: Is this needed any more?
app.get("/*.css", streamFile(req => assets.toFile(req.path)))

// Serve common & client modules
const static = ['common', 'client']

static.forEach(dir => {
  app.use(`/${dir}`, express.static(path.join(__dirname, '..', dir), {
    extensions: ['mjs'],
    index: 'index.mjs'
  }))
})

// In these entries we designate /~/ to refer to node_modules
// Modules generally not designed for esm-browser use and are all
// packaged differently, so manip them individually

// Serve marked
app.get('/~/marked', (req, res, next) => {
  // This is a cjs module so we have to convert to esm with some
  // gross hacky-hacks
  res.set('Content-Type', 'application/javascript');

  // Todo: use stream template for these
  res.write(`
    const exports = {};
    const module = { exports };
  `);

  const stream = streamFile(
    require.resolve('marked/lib/marked.js'),
    {
      end: false
    }
  )(req, res, next);

  stream.on('end', () => {
    res.write(`
      export default module.exports;
    `)

    res.end();
  })
})

// Serve vue lib
app.get('/~/vue', (req, res, next) => {
  // This is an esm file but it's designed for webpack
  // so requires process.env to be defined
  res.set('Content-Type', 'application/javascript');
  // Todo - can this be done on `window`?
  res.write(`
    const process = {
      env: {}
    };
  `);

  // Todo: Use the runtime version
  // - requires template pre-compilation (or use JSX?)
  streamFile(require.resolve('vue/dist/vue.esm.js'))(req, res, next);
})

app.get('/~/vuedraggable', (req, res, next) => {
  // This is a cjs module so we have to convert to esm with some
  // gross hacky-hacks
  res.set('Content-Type', 'application/javascript');
  res.write(`
    let exports = {};
    let module = { exports };
  `);

  const sortableStream = streamFile(
    require.resolve('sortablejs/Sortable.min.js'),
    {
      end: false
    }
  )(req, res, next);

  sortableStream.on('end', () => {
    res.write(`
      let s = module.exports;
      function require() {
        return s;
      }

      exports = {};
      module = { exports };
    `);

    const stream = streamFile(
      require.resolve('vuedraggable/dist/vuedraggable.js'),
      {
        end: false
      }
    )(req, res, next);

    stream.on('end', () => {
      res.write(`
        export default module.exports;
      `)

      res.end();
    })
  })
})

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
    <script>
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

// Todo: make these json api calls
// have the main handler parse its own form data

// Add new task
app.post("/add", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get("title");
  const note = data.get("note");

  const r = await req.toodledo.post(
    "/tasks/add.php",
    `tasks=[${encodeURIComponent(JSON.stringify({ title, note }))}]`
  );

  console.log(r.statusCode);
  res.redirect("/");
});

// Edit existing task
app.post("/edit/:id", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get("title");
  const note = data.get("note");
  const status = data.get("status");
  const id = req.params.id;

  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=[${encodeURIComponent(JSON.stringify({ id, note, title, status }))}]`
  );

  console.log(r.statusCode);
  res.redirect("/");
});

// Bulk update
app.post("/update", async (req, res) => {
  const data = await parseFormData(req);
  const updates = JSON.parse(data.get('json'));

  const payload = updates.map(u => encodeURIComponent(JSON.stringify({
    id: u.id,
    tag: 'weight: ' + u.weight
  }))).join(',');

  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=[${payload}]`
  );

  res.sendStatus(r.statusCode);
})

// Reorder tasks
app.post("/move", async (req, res) => {
  try {
    const data = await parseFormData(req);
    const status = data.get('status')
    const id = data.get('id')
    const position = data.get('position')

    const items = await req.toodledo.getTasks(["status", "tag"], status)

    const ix = items.findIndex(i => i.id === +id)
    const a = items[ix];
    const b = items[ix + +position];
    const delta = b.order - a.order;

    console.log(a.weight, b.weight);

    a.weight += delta;
    b.weight -= delta;

    console.log(b.weight, a.weight);

    const payload = ({ id, weight }) => encodeURIComponent(JSON.stringify({ id, tag: 'weight: '+ weight }))

    const r = await req.toodledo.post(
      "/tasks/edit.php",
      `tasks=[${payload(a)}, ${payload(b)}]`
    );

    console.log(r.statusCode);
  } catch(e) {
    console.log(e)
  } finally {
    res.redirect("/");
  }
})

// Compete task
app.post("/:id", async (req, res) => {
  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`
  );

  console.log(r.statusCode);
  res.redirect("/");
});

// Handle errors
// Todo: Nice error pages
app.use((err, req, res, next) => {
  let msg = {};

  try {
    msg = JSON.parse(err.message);
  } catch (e) {}

  if (msg.errorCode === 2) {
    res.redirect(req.originalUrl);
    return;
  }

  res.send("<pre>" + err.stack + "</pre>");
});


// Start
app.listen(PORT, () => {
  console.log("http://localhost:" + PORT);
});
