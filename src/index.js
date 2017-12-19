const express = require("express");
const https = require("https");
const URL = require("url");
const app = express();
const { clientId, secret, port } = require("./env.js");
const state = (Math.random() * 10 ** 17).toString(16);

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

const getItems = code =>
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
        const { access_token } = JSON.parse(await collect(res));

        https.get(
          `https://api.toodledo.com/3/tasks/get.php?access_token=` +
            access_token,
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
    r.write(`grant_type=authorization_code&code=${code}&vers=3&os=7`);

    r.end();
  });

app.get("/", async (req, res) => {
  const { code, state, error } = req.query;

  if (!code && !state && !error) {
    res.redirect(auth);
  } else {
    res.send(await getItems(code));
  }
});

app.listen(port, () => {
  console.log("http://localhost:" + port);
});
