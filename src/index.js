const express = require("express");
const https = require("https");
const URL = require("url");
const parseFormData = require("isomorphic-form/dist/server");
const app = express();
const { clientId, secret, port } = require("./env.js");
const state = (Math.random() * 10 ** 17).toString(16);
const marked = require("marked");

const tryRequire = f =>  { try { return require(f) } catch(e) { console.log(e) } }

let accessToken = tryRequire('../token.json')

const auth = `https://api.toodledo.com/3/account/authorize.php?response_type=code&client_id=${clientId}&state=${state}&scope=basic%20tasks%20write`;

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

const getAccessToken = code =>
  new Promise((resolve, reject) => {
    const r = https.request(
      {
        ...URL.parse("https://api.toodledo.com/3/account/token.php"),
        method: "POST",
        headers: {
          Authorization:
            "Basic " + new Buffer(clientId + ":" + secret).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        }
      },
      async res => {
        try {
          const txt = await collect(res)
          console.log(txt)
          const { access_token } = JSON.parse(txt);
          require('fs').writeFileSync(__dirname + '/../token.json', JSON.stringify(access_token))
          resolve(access_token)
        } catch (e) {
          reject(e)
        }
      }
    )

    r.write(`grant_type=authorization_code&code=${code}&vers=3&os=7`);
    r.end();
  })

const getItems = accessToken =>
  new Promise((resolve, reject) => {
        https.get(
          `https://api.toodledo.com/3/tasks/get.php?access_token=${accessToken}&fields=note,status,tag`,
          async res => {
            const str = await collect(res);

            if (res.statusCode >= 400) {
              reject(new Error(str))
              return
            }

            resolve(
              JSON.parse(str)
                .filter(i => i.id && !i.completed && i.status == 0)
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
                  return `<form action="/${i.id}" style="display:inline" method="post">
                    <button>x</button>
                  </form>
                  <div style="display: inline-block;vertical-align: middle; margin: 5px 0;">
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
                    `<details style="display: inline;">
                      <summary>${i.title}</summary>
                      ${marked(i.note)}
                    </details>` : i.title}
                  <details style="display: inline">
                    <summary>Edit</summary>
                    <form action="/edit/${i.id}" method="post">
                      <input name=title value="${ i.title.replace(/"/g, '&quot;') }"><br>
                      <textarea name=note>${i.note}</textarea><br>
                      <button>Save</button>
                    </form>
                  </details>`
                })
                .join("<br>")
            );
          }
        );
      }
    );

app.get("/", async (req, res, next) => {
  try {
    if (!accessToken) {
      const { code } = req.query;

      if (!code) {
        res.redirect(auth);
        return;
      }

      console.log(code)

      accessToken = await getAccessToken(code)

      console.log(accessToken)
      res.redirect('/');
      return;
    }

    res.send(`
    <form action="add" method="post">
      <input name="title"><button>Ok</button><br>
      <textarea name="note"></textarea>
    </form>
    ` + await getItems(accessToken));
  } catch (e) {
    next(e)
  }
});

app.post("/add", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get('title')
  const note = data.get('note')

  const r = https.request(
    {
      ...URL.parse('https://api.toodledo.com/3/tasks/add.php'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, 
    (r) => {
      console.log(r.statusCode)
      res.redirect('/')

      collect(r).then(d => {
        console.log(d)
      })
    }
  )

  r.write(`access_token=${accessToken}&tasks=[${encodeURIComponent(JSON.stringify({title, note}))}]`)
  r.end()
})

app.post("/edit/:id", async (req, res) => {
  const data = await parseFormData(req);
  const title = data.get('title')
  const note = data.get('note')
  const id = req.params.id;

  const r = https.request(
    {
      ...URL.parse('https://api.toodledo.com/3/tasks/edit.php'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, 
    (r) => {
      console.log(r.statusCode)
      res.redirect('/')

      collect(r).then(d => {
        console.log(d)
      })
    }
  )

  r.write(`access_token=${accessToken}&tasks=[${encodeURIComponent(JSON.stringify({id, note, title}))}]`)
  r.end()
})

app.post("/order", async (req, res) => {
  const data = await parseFormData(req);
  const items = data.getAll("set").map(set => {
    const [id, weight] = set.split("=");
    return { id: parseInt(id, 10), tag: 'weight: ' + weight };
  })
  console.log('order', items)

  const r = https.request(
    {
      ...URL.parse('https://api.toodledo.com/3/tasks/edit.php'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, 
    (r) => {
      console.log(r.statusCode)
      res.redirect('/')

      collect(r).then(d => {
        console.log(d)
      })
    }
  )

  r.write(`access_token=${accessToken}&tasks=${JSON.stringify(items)}`)
  r.end()
})

app.post("/:id", async (req, res) => {
  const r = https.request(
    {
      ...URL.parse('https://api.toodledo.com/3/tasks/edit.php'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }, 
    (r) => {
      console.log(r.statusCode)
      res.redirect('/')

      collect(r).then(d => {
        console.log(d)
      })
    }
  )

  r.write(`access_token=${accessToken}&tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`)
  r.end()
})

app.use((err, req, res, next) => {
  let msg = {};

  try {
    msg = JSON.parse(err.message);
  } catch(e) {}

  if (msg.errorCode === 2) {
    accessToken = null;

    res.redirect(req.originalUrl);
  }

  res.send('<pre>' + err.toString() + '</pre>')
})

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
