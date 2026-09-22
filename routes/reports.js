const express = require("express");

const categories = [
  "Electrical / Lighting",
  "Plumbing / Taps",
  "Locks / Access",
  "Cleaning / Damage",
];

function createReportsRouter(getDatabase, saveDatabase) {
  const router = express.Router();

  router.post("/", (req, res) => {
    const { facility, category, details } = req.body || {};
    const database = getDatabase();
    const facilityExists = database.facilities.some(
      (item) => item.name === facility,
    );
    if (!facility || !facilityExists || !categories.includes(category)) {
      return res
        .status(400)
        .json({ error: "facility and a valid category are required" });
    }
    if (typeof details !== "string" || details.trim().length < 5) {
      return res
        .status(400)
        .json({ error: "details must be at least 5 characters" });
    }

    const ticketId =
      10000 +
      database.reports.reduce(
        (maxId, item) => Math.max(maxId, item.ticketId - 10000),
        0,
      ) +
      1;
    database.reports.push({
      ticketId,
      facility,
      category,
      details: details.trim(),
      createdAt: new Date().toISOString(),
    });
    saveDatabase(database);
    return res.status(201).json({ ticketId });
  });

  router.get("/", (req, res) => res.json(getDatabase().reports));
  return router;
}

module.exports = { categories, createReportsRouter };
