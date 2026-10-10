const express = require("express");
const { isValidDate, todayIn, addDays, addMonths } = require("../services/dates");
const { getUnavailableReason } = require("../services/availability");
const { notify } = require("../services/notifications");
const { nextId } = require("../services/ids");

function bookingWindow(config) {
  const today = todayIn(config.timezone);
  return {
    today,
    min: addDays(today, config.bookings.minNoticeDays),
    max: addMonths(today, config.bookings.maxAdvanceMonths),
  };
}

function createBookingsRouter(getDatabase, saveDatabase, config) {
  const router = express.Router();
  const own = (req) => (booking) => booking.owner === req.user.email;

  router.get("/", (req, res) => {
    const bookings = getDatabase()
      .bookings.filter(own(req))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    res.json(bookings);
  });

  router.post("/", (req, res) => {
    const { facility: facilityName, date } = req.body || {};
    const database = getDatabase();
    const facility = database.facilities.find(
      (item) => item.name === facilityName,
    );
    if (!facilityName || !facility) {
      return res.status(400).json({ error: "a valid facility is required" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
    }
    const window = bookingWindow(config);
    if (date < window.min) {
      return res.status(400).json({
        error: `bookings must be for ${window.min} or later`,
      });
    }
    if (date > window.max) {
      return res.status(400).json({
        error: `bookings can only be made up to ${window.max}`,
      });
    }
    const reason = getUnavailableReason(database, facility, date);
    if (reason) {
      return res.status(409).json({
        error:
          reason === "Closed"
            ? "this facility is closed on that date"
            : "this facility is already booked on that date",
      });
    }

    const booking = {
      id: nextId(database.bookings),
      facility: facility.name,
      facilityId: facility.id,
      date,
      owner: req.user.email,
      createdAt: new Date().toISOString(),
    };
    database.bookings.push(booking);
    notify(
      database,
      req.user.email,
      `Booking confirmed: ${facility.name} on ${date}.`,
    );
    saveDatabase(database);
    return res.status(201).json(booking);
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const database = getDatabase();
    const booking = database.bookings.find(
      (item) => item.id === id && item.owner === req.user.email,
    );
    if (!booking) return res.status(404).json({ error: "booking not found" });
    database.bookings = database.bookings.filter((item) => item !== booking);
    notify(
      database,
      req.user.email,
      `Booking cancelled: ${booking.facility} on ${booking.date}.`,
    );
    saveDatabase(database);
    return res.status(204).end();
  });

  return router;
}

module.exports = { createBookingsRouter, bookingWindow, isValidDate };
