const express = require("express");

const categories = [
  "Electrical / Lighting",
  "Plumbing / Taps",
  "Locks / Access",
  "Cleaning / Damage",
];

function createReportsRouter(getStore) {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const { facility, category, details } = req.body || {};
      const store = await getStore();
      const facilities = await store.getFacilities();
      const facilityExists = facilities.some((item) => item.name === facility);
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

      const report = await store.createReport(
        facility,
        category,
        details.trim(),
      );
      return res.status(201).json({ ticketId: report.ticketId });
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const store = await getStore();
      res.json(await store.getReports());
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { categories, createReportsRouter };
