const express = require("express");

function createNotificationsRouter(getDatabase, saveDatabase) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const items = getDatabase()
      .notifications.filter((item) => item.owner === req.user.email)
      .sort((a, b) => b.id - a.id)
      .slice(0, 50)
      .map(({ id, message, createdAt, read }) => ({ id, message, createdAt, read }));
    res.json(items);
  });

  router.post("/read", (req, res) => {
    const database = getDatabase();
    let changed = false;
    for (const item of database.notifications) {
      if (item.owner === req.user.email && !item.read) {
        item.read = true;
        changed = true;
      }
    }
    if (changed) saveDatabase(database);
    res.status(204).end();
  });

  return router;
}

module.exports = { createNotificationsRouter };
