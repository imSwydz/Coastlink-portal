const express = require("express");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function createBookingsRouter(getDatabase, saveDatabase) {
  const router = express.Router();

  router.get("/", (req, res) => res.json(getDatabase().bookings));

  router.post("/", (req, res) => {
    const { facility, date } = req.body || {};
    const database = getDatabase();
    const facilityExists = database.facilities.some(
      (item) => item.name === facility,
    );
    if (!facility || !facilityExists) {
      return res.status(400).json({ error: "a valid facility is required" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
    }

    const booking = {
      id:
        database.bookings.reduce((maxId, item) => Math.max(maxId, item.id), 0) +
        1,
      facility,
      date,
    };
    database.bookings.push(booking);
    saveDatabase(database);
    return res.status(201).json(booking);
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const database = getDatabase();
    const before = database.bookings.length;
    database.bookings = database.bookings.filter(
      (booking) => booking.id !== id,
    );
    if (database.bookings.length === before) {
      return res.status(404).json({ error: "booking not found" });
    }
    saveDatabase(database);
    return res.status(204).end();
  });

  return router;
}

module.exports = { createBookingsRouter, isValidDate };
