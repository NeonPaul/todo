const URL = require("url");
const https = require("https");
const querystring = require("querystring");

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

    return auth && this.setAuth(auth, true)
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

module.exports = Toodledo;
