const express = require("express");
const https = require("https");
const URL = require("url");
const querystring = require("querystring");
const parseFormData = require("isomorphic-form/dist/server");
const jose = require('node-jose');
const marked = require("marked");
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

const status = {
  NONE: 0,
  NEXT: 0,
  WAITING: 5,
  SOMEDAY: 8
};

const withCss = css => ({
  inject: ["insertCss"],
  created() {
    this.insertCss(
      cssData(css)
    );
  }
})

const Item = {
  mixins: [withCss(`
  .Item {
    display: flex;
    align-items: flex-start;
  }
  
  .Item__move {
    margin: 5px 0;
  }

  .Item__move form {
    margin: 0;
  }

  .Item__move form button {
    font-size: 50%;
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
    <form :action="'/'+i.id" method="post">
      <button>x</button>
    </form>
    <div class="Item__move">
      <form action="/order" method="post">
        <button :disabled="!pt">▲</button>
        <input type="hidden" name="set" :value="i.id+'='+(i.weight - 1)">
        <input type="hidden" name="set" :value="(pt && pt.id) + '=' + (pt &&
  pt.weight + 1)">
      </form>
      <form action="/order" method="post">
        <button :disabled="!nt">▼</button>
        <input type="hidden" name="set" :value="i.id + '=' + (i.weight + 1)">
        <input type="hidden" name="set" :value="(nt && nt.id) + '=' + (nt &&
  nt.weight - 1)">
      </form>
    </div>
    <details v-if="i.note">
      <summary>{{ i.title }}</summary>
      <div v-html="noteMd"></div>
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

const Items = {
  props: ['items'],
  components: {
    Item
  },
  template: `<div><template v-for="item in items">
    <Item v-bind="item"/><br>
  </template></div>`
}

const AddForm = { template: `
<form action="add" method="post" autocomplete="off">
  <input name="title" autofocus><br>
  <textarea name="note"></textarea><button>Ok</button>
</form>
` };

const provide = (css, Child) => {
  return new Vue({
    provide() {
      return {
        insertCss(...styles) {
          styles.forEach(s => css.add(s));
        }
      };
    },
    components: { Child },
    template: "<Child />"
  });
};

const cssData = css => `data:text/css,${encodeURIComponent(css)}`;

const Index = ({ items, css }) =>
  provide(css, {
    components: {
      AddForm,
      Items
    },
    data(){
      return {
        items
      }
    },
    template: `<body>
      <a href="/">Next</a> |
      <a href="?status=${status.SOMEDAY}">Someday</a> |
      <a href="?status=${status.WAITING}">Waiting</a>
    <Add-Form /><Items :items="items" /></body>`,
    inject: ["insertCss"],
    mixins: [withCss(`
      body{
        font-family:sans-serif;
      }
    `)]
  });

const renderer = require("vue-server-renderer").createRenderer();

let accessToken = tryRequire("../token.json");

const collect = res =>
  new Promise(resolve => {
    let str = "";
    res.on("data", data => {
      str += data;
    });
    res.on("end", () => {
      resolve(str);
    });
  });

class Toodledo {
  constructor(clientId, secret) {
    this.clientId = clientId;
    this.secret = secret;
    this.baseUrl = "https://api.toodledo.com/3";
  }

  onAuth(cb) {
    this.authCb = cb;
  }

  authorise(auth, cb) {
    if(cb) {
      this.onAuth(cb);
    }

    return this.setAuth(auth, true)
  }

  async setAuth(auth, init) {
    if (!auth.expiryDate) {
      throw new Error('No expiry date set');
    }

    const authDate = new Date(auth.expiryDate);
    this.auth = auth;

    const now = new Date();

    if (authDate <= now) {
      this.reAuth = true;
      await this.refreshAccessToken();
    } else if (this.authCb && !init) {
      await this.authCb(auth);
    }
  }

  get accessToken() {
    return this.auth && this.auth.accessToken;
  }

  getAuthUrl(scope, state) {
    return `${
      this.baseUrl
    }/account/authorize.php?response_type=code&client_id=${
      this.clientId
    }&state=${state}&scope=${scope.join("%20")}`;
  }

  async request(options, config) {
    return await new Promise(resolve => {
      const r = https.request(options, resolve);

      if (config) {
        config(r);
      }

      r.end();
    });
  }

  async get(url, config) {
    const { protocol, host, pathname, query } = URL.parse(
      this.baseUrl + url,
      true
    );

    const options = {
      protocol,
      host,
      pathname,
      search:
        "?" +
        querystring.stringify({
          ...query,
          access_token: this.accessToken
        })
    };

    const res = await this.request(URL.format(options), config);

    const str = await collect(res);

    if (res.statusCode >= 400) {
      throw new Error(str);
    }

    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Couldn't parse JSON: ${str}`);
    }
  }

  post(url, payload) {
    return this.request(
      {
        ...URL.parse(this.baseUrl + url),
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      },
      r => {
        const query = payload + "&access_token=" + this.accessToken;
        r.write(query);
      }
    );
  }

  async requestToken(options) {
    const res = await this.request(
      {
        ...URL.parse(this.baseUrl + "/account/token.php"),
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            new Buffer(this.clientId + ":" + this.secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        }
      },
      req => {
        req.write(querystring.stringify(options));
      }
    );

    const {
      access_token: accessToken,
      expires_in: expiresIn,
      refresh_token: refreshToken,
      errorCode,
      errorDesc
    } = JSON.parse(await collect(res));

    if (errorCode) {
      throw new Error(`${errorCode}: ${errorDesc}`)
    }

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

    await this.setAuth({
      accessToken,
      expiryDate,
      refreshToken
    });
  }

  getAccessToken(code, state) {
    return this.requestToken({ grant_type: "authorization_code", code });
  }

  refreshAccessToken() {
    const refreshToken = this.auth && this.auth.refreshToken;

    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    return this.requestToken({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });
  }

  async getTasks(fields, status = 0) {
    const tasks = await this.get("/tasks/get.php?fields=" + fields.join(","));

    return tasks
      .filter(i => i.id && !i.completed && i.status == status)
      .map((todo, ix) => {
        const [, weight] = todo.tag.match(/weight: (-?[0-9]+)/) || [0, 0];
        todo.weight = parseInt(weight, 10);
        todo.order = ix + todo.weight;
        return todo;
      })
      .sort((a, b) => a.order - b.order)
      .map((i, ix, tasks) => {
        const pt = tasks[ix - 1];
        const nt = tasks[ix + 1];
        return { i, pt, nt };
      });
  }
}

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

    const index = Index({ items: await getItems(req.query.status || 0), css });

    const body = await renderer.renderToString(index);

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

  collect(r).then(d => {
    console.log(d);
  });
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

  collect(r).then(d => {
    console.log(d);
  });
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

  collect(r).then(d => {
    console.log(d);
  });
});

app.post("/:id", async (req, res) => {
  const r = await req.toodledo.post(
    "/tasks/edit.php",
    `tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`
  );

  console.log(r.statusCode);
  res.redirect("/");

  collect(r).then(d => {
    console.log(d);
  });
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
