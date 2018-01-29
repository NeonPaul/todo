const express = require("express");
const https = require("https");
const URL = require("url");
const querystring = require("querystring")
const parseFormData = require("isomorphic-form/dist/server");
const app = express();
const { clientId, secret, port } = require("./env.js");
const state = (Math.random() * 10 ** 17).toString(16);
const marked = require("marked");

const tryRequire = f =>  { try { return require(f) } catch(e) { console.log(e) } }

const Item = ({ i, pt, nt }) => `
  <style>
    .Item {
      display: flex;
      align-items: flex-start;
    }
  </style>
  <div class="Item">
    <form action="/${i.id}" method="post">
      <button>x</button>
    </form>
    <div style="margin: 5px 0;">
      <form action="/order" method="post" style="margin: 0">
        <button${ pt ? '' : ' disabled'} style="font-size: 50%;">▲</button>
        <input type="hidden" name="set" value="${i.id}=${i.weight - 1}">
        <input type="hidden" name="set" value="${pt && pt.id}=${pt && (pt.weight + 1)}">
      </form>
      <form action="/order" method="post" style="margin: 0">
        <button${ nt ? '' : ' disabled'} style="font-size: 50%;">▼</button>
        <input type="hidden" name="set" value="${i.id}=${i.weight + 1}">
        <input type="hidden" name="set" value="${nt && nt.id}=${nt && (nt.weight - 1)}">
      </form>
    </div>
    ${i.note ?
      `<details>
        <summary>${i.title}</summary>
        ${marked(i.note)}
      </details>` : i.title}
    <details>
      <summary>Edit</summary>
      <form action="/edit/${i.id}" method="post">
        <input name=title value="${ i.title.replace(/"/g, '&quot;') }"><br>
        <textarea name=note>${i.note}</textarea><br>
        <button>Save</button>
      </form>
    </details>
  </div>`
const Items = ({ items }) => items.map(Item).join('<br>');

const AddForm = () => `
<form action="add" method="post">
  <input name="title" autofocus><br>
  <textarea name="note"></textarea><button>Ok</button>
</form>
`

const Index = ({ items }) => `${AddForm()}${Items({ items })}`;

let accessToken = tryRequire('../token.json')

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
  constructor(clientId, secret, accessToken) {
    this.clientId = clientId;
    this.secret = secret;
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.toodledo.com/3';
  }

  getAuthUrl(scope, state) {
    return `${this.baseUrl}/account/authorize.php?response_type=code&client_id=${this.clientId}&state=${state}&scope=${scope.join('%20')}`;
  }

  async request(options, config) {
    return await new Promise((resolve) => {
      const r = https.request(
        options,
        resolve
      )

      if (config) {
        config(r);
      }

      r.end();
    });
  }

  async get(url, config) {
    const { protocol, host, pathname, query }  = URL.parse(this.baseUrl + url, true);

    const options = {
      protocol,
      host,
      pathname,
      search: '?' + querystring.stringify({
        ...query,
        access_token: this.accessToken
      })
    }

    const res = await this.request(URL.format(options), config);

    const str = await collect(res);

    if (res.statusCode >= 400) {
      throw new Error(str)
    }

    try {
      return JSON.parse(str);
    } catch (e) {
      throw new Error(`Couldn't parse JSON: ${str}`);
    }
  }

  post(url, payload) {
    return this.request({
      ...URL.parse(this.baseUrl + url),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, r => {
      const query = payload + '&access_token=' + this.accessToken
      r.write(query);
    })
  }

  async getAccessToken(code, state) {
    const res = await this.request(
      {
        ...URL.parse(this.baseUrl + "/account/token.php"),
        method: "POST",
        headers: {
          Authorization:
            "Basic " + new Buffer(this.clientId + ":" + this.secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        }
      },
      req => {
        req.write(`grant_type=authorization_code&code=${code}&vers=3&os=7`);
      }
    )

    const { access_token } = JSON.parse(await collect(res))

    this.accessToken = access_token;
    return access_token;
  }

  async getTasks(fields) {
    const tasks = await this.get('/tasks/get.php?fields=' + fields.join(','));

    return tasks.filter(i => i.id && !i.completed && i.status == 0)
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
      return ({ i, pt, nt });
    })
  }
}

const toodledo = new Toodledo(clientId, secret, accessToken);

const auth = toodledo.getAuthUrl(['basic','tasks','write'], state);

const getAccessToken = async code => {
  const access_token = await toodledo.getAccessToken(code, state);

  require('fs').writeFileSync(__dirname + '/../token.json', JSON.stringify(access_token))
}

const getItems = () => toodledo.getTasks(['note','status','tag'])

app.get("/", async (req, res, next) => {
  try {
    if (!toodledo.accessToken) {
      const { code } = req.query;

      if (!code) {
        res.redirect(auth);
        return;
      }

      await getAccessToken(code)

      res.redirect('/');
      return;
    }

    res.send(Index({ items: await getItems() }));
  } catch (e) {
    next(e)
  }
});

app.post("/add", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get('title')
  const note = data.get('note')

  const r = await toodledo.post('/tasks/add.php', `tasks=[${encodeURIComponent(JSON.stringify({title, note}))}]`)

  console.log(r.statusCode)
  res.redirect('/')

  collect(r).then(d => {
    console.log(d)
  })
})

app.post("/edit/:id", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get('title')
  const note = data.get('note')
  const id = req.params.id;

  const r = await toodledo.post('/tasks/edit.php', 
    `tasks=[${encodeURIComponent(JSON.stringify({id, note, title}))}]`
  )

  console.log(r.statusCode)
  res.redirect('/')

  collect(r).then(d => {
    console.log(d)
  })
})

app.post("/order", async (req, res) => {
  const data = await parseFormData(req);
  const items = data.getAll("set").map(set => {
    const [id, weight] = set.split("=");
    return { id: parseInt(id, 10), tag: 'weight: ' + weight };
  })
  console.log('order', items)

  const r = await toodledo.post('/tasks/edit.php',`tasks=${JSON.stringify(items)}`);

  console.log(r.statusCode)
  res.redirect('/')

  collect(r).then(d => {
    console.log(d)
  })
})

app.post("/:id", async (req, res) => {
  const r = await toodledo.post('/tasks/edit.php', `tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`);

  console.log(r.statusCode)
  res.redirect('/')

  collect(r).then(d => {
    console.log(d)
  })
})

app.use((err, req, res, next) => {
  let msg = {};

  try {
    msg = JSON.parse(err.message);
  } catch(e) {}

  if (msg.errorCode === 2) {
    accessToken = null;

    res.redirect(req.originalUrl);
    return;
  }

  res.send('<pre>' + err.toString() + '</pre>')
})

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
