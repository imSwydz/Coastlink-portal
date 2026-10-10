const express = require("express");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function createBookingsRouter(getStore) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const store = await getStore();
      res.json(await store.getBookings());
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const { facility, date } = req.body || {};
      const store = await getStore();
      const facilities = await store.getFacilities();
      const facilityExists = facilities.some((item) => item.name === facility);
      if (!facility || !facilityExists) {
        return res.status(400).json({ error: "a valid facility is required" });
      }
      if (!isValidDate(date)) {
        return res
          .status(400)
          .json({ error: "date must use YYYY-MM-DD format" });
      }

      const booking = await store.createBooking(facility, date);
      return res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const store = await getStore();
      if (!(await store.deleteBooking(id))) {
        return res.status(404).json({ error: "booking not found" });
      }
      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createBookingsRouter, isValidDate };
