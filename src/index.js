const express = require("express");
const https = require("https");
const URL = require("url");
const app = express();
const { clientId, secret, port } = require("./env.js");
const state = (Math.random() * 10 ** 17).toString(16);
let accessToken;

const auth = `https://api.toodledo.com/3/account/authorize.php?response_type=code&client_id=${clientId}&state=${state}&scope=basic%20tasks`;

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
          const { access_token } = JSON.parse(await collect(res));
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
          `https://api.toodledo.com/3/tasks/get.php?access_token=` +
            accessToken,
          async res => {
            const str = await collect(res);

            resolve(
              JSON.parse(str)
                .filter(i => !i.completed)
                .map(i => i.title)
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

    accessToken = await getAccessToken(code)
    res.redirect('/');
    return;
  }

  res.send(await getItems(accessToken));
});

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
