const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

// Todo: make these json api calls
// have the main handler parse its own form data

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// Add new task
router.post("/add", async (req, res, next) => {
    const { title, note } = req.body;

    const r = await req.toodledo.post(
      "/tasks/add.php",
      `tasks=[${encodeURIComponent(JSON.stringify({ title, note }))}]`
    );

    console.log(r.statusCode);
    res.location("/");
    next();
  });

  // Edit existing task
  router.post("/edit/:id", async (req, res, next) => {
    const props = req.body;
    const id = req.params.id;

    const r = await req.toodledo.post(
      "/tasks/edit.php",
      `tasks=[${encodeURIComponent(JSON.stringify({ id, ...props }))}]`
    );

    console.log(r.statusCode);
    res.location("/");
    next();
  });

  // Bulk update
  router.post("/update", async (req, res) => {
    const data = req.body;
    const updates = JSON.parse(data.json);

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
  router.post("/move", async (req, res, next) => {
    try {
      const data = req.body;
      const status = data.status;
      const id = data.id;
      const position = data.position;

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
      res.location("/");
      next();
    }
  })

  // Compete task
  router.post("/:id", async (req, res, next) => {
    const r = await req.toodledo.post(
      "/tasks/edit.php",
      `tasks=[{"id"%3A${req.params.id}%2C"completed":1}]`
    );

    console.log(r.statusCode);
    res.location("/");
    next();
  });

  router.use((req, res, next) => {
    if (res.location) {
      res.sendStatus(302);
    } else {
      next();
    }
  });

  // Handle errors
  // Todo: Nice error pages
  router.use((err, req, res) => {
    let msg = {};

    try {
      msg = JSON.parse(err.message);
    } catch (e) {}

    if (msg.errorCode === 2) {
      res.redirect(req.originalUrl);
      return;
    }

    res.status(500);

    res.send("<pre>" + err.stack + "</pre>");
  });

  module.exports = router;
