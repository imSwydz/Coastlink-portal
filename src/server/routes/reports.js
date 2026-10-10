const express = require("express");
const { advanceTickets } = require("../services/tickets");
const { notify } = require("../services/notifications");

const categories = [
  "Electrical / Lighting",
  "Plumbing / Taps",
  "Locks / Access",
  "Cleaning / Damage",
];

function createReportsRouter(getDatabase, saveDatabase, config) {
  const router = express.Router();

  function ownReports(req) {
    const database = getDatabase();
    if (advanceTickets(database, config)) saveDatabase(database);
    return database.reports
      .filter((report) => report.owner === req.user.email)
      .sort((a, b) => b.ticketId - a.ticketId);
  }

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
    const { minDetailsLength, maxDetailsLength } = config.reports;
    if (typeof details !== "string" || details.trim().length < minDetailsLength) {
      return res.status(400).json({
        error: `details must be at least ${minDetailsLength} characters`,
      });
    }
    if (details.trim().length > maxDetailsLength) {
      return res.status(400).json({
        error: `details must be ${maxDetailsLength} characters or fewer`,
      });
    }

    const now = new Date().toISOString();
    const ticketId =
      database.reports.reduce(
        (max, item) => Math.max(max, item.ticketId),
        10000,
      ) + 1;
    database.reports.push({
      ticketId,
      facility,
      category,
      details: details.trim(),
      status: "Received",
      owner: req.user.email,
      createdAt: now,
      updatedAt: now,
    });
    notify(database, req.user.email, `Report received: ticket #${ticketId}.`);
    saveDatabase(database);
    return res.status(201).json({ ticketId, status: "Received", createdAt: now });
  });

  router.get("/", (req, res) => res.json(ownReports(req)));

  router.get("/:ticketId", (req, res) => {
    const ticketId = parseInt(req.params.ticketId, 10);
    const report = ownReports(req).find((item) => item.ticketId === ticketId);
    if (!report) return res.status(404).json({ error: "report not found" });
    return res.json(report);
  });

  return router;
}

module.exports = { categories, createReportsRouter };
