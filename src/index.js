const express = require("express");
const parseFormData = require("isomorphic-form/dist/server");
const jose = require('node-jose');
const Vue = require("vue");
const cookie = require('cookie');

const app = express();

try {
  const { clientId, secret, port, jweKey } = require("./env.js");
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

const state = (Math.random() * 10 ** 17).toString(16);

let key;

jose.JWK.asKey(JWE_KEY).then(k => { key = k });

const tryRequire = f => {
  try {
    return require(f);
  } catch (e) {
  }
};

const Index = require('./components/index')

const renderer = require("vue-server-renderer").createRenderer();

let accessToken = tryRequire("../token.json");

const Toodledo = require('./toodledo');

const cookieKey = 'auth';

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

    if (!auth) {
      auth = accessToken;
      setCookie(auth)
    }

    const toodledo = new Toodledo(CLIENT_ID, SECRET);

    await toodledo.authorise(auth, setCookie);

    req.toodledo = toodledo;

    next();
  } catch(e) {
    next(e);
  }
})

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
    const items = await getItems(req.query.status || 0)

    const app = new Vue({
      provide() {
        return {
          insertCss(...styles) {
            styles.forEach(s => css.add(s));
          }
        };
      },
      render: h => h(Index, { props: { items }})
    });

    const body = await renderer.renderToString(app);

    const html = `<!doctype html -->
<html>
  <head>
    <meta charset="utf-8">
    <title>Todo</title>
    ${Array.from(css)
      .map(url => `<link rel=stylesheet href="${url}">`)
      .join("\n")}
  </head>
  ${body}
</html>`;

    res.send(html);
  } catch (e) {
    next(e);
  }
});

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

app.post("/order", async (req, res) => {
  const data = await parseFormData(req);
  const items = data.getAll("set").map(set => {
    const [id, weight] = set.split("=");
    return { id: parseInt(id, 10), tag: "weight: " + weight };
  });

  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=${JSON.stringify(items)}`
  );

  console.log(r.statusCode);
  res.redirect("/");
});

app.post("/:id", async (req, res) => {
  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`
  );

  console.log(r.statusCode);
  res.redirect("/");
});

app.use((err, req, res, next) => {
  let msg = {};

  try {
    msg = JSON.parse(err.message);
  } catch (e) {}

  if (msg.errorCode === 2) {
    accessToken = null;

    res.redirect(req.originalUrl);
    return;
  }

  res.send("<pre>" + err.stack + "</pre>");
});

app.listen(PORT, () => {
  console.log("http://localhost:" + PORT);
});
