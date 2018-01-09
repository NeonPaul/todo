const express = require("express");
const https = require("https");
const URL = require("url");
const app = express();
const { clientId, secret, port } = require("./env.js");
const state = (Math.random() * 10 ** 17).toString(16);

const tryRequire = f =>  { try { return require(f) } catch(e) { } }

let accessToken = tryRequire('./token.json')

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
          require('fs').writeFileSync('token.json', JSON.stringify(access_token))
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
          `https://api.toodledo.com/3/tasks/get.php?access_token=${accessToken}&fields=note`,
          async res => {
            const str = await collect(res);

            resolve(
              JSON.parse(str)
                .filter(i => i.id && !i.completed)
                .map(i =>
                  `<form action="/${i.id}" style="display:inline" method="post">
                    <button>x</button>
                  </form>
                  ${i.note ?
                    `<details style="display: inline;">
                      <summary>${i.title}</summary>
                      ${i.note}
                    </details>` : i.title}`
                )
                .join("<br>")
            );
          }
        );
      }
    );

app.get("/", async (req, res) => {
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

  res.send(await getItems(accessToken));
});

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

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
