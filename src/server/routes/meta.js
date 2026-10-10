const express = require("express");
const { todayIn } = require("../services/dates");
const { categories } = require("./reports");
const { statuses } = require("../services/tickets");
const { bookingWindow } = require("./bookings");

/** Public, read-only data the front end needs to render itself. */
function createMetaRouter(getDatabase, config) {
  const router = express.Router();

  router.get("/config", (req, res) => {
    const window = bookingWindow(config);
    res.json({
      today: window.today,
      minBookingDate: window.min,
      maxBookingDate: window.max,
      fullRefundDays: config.bookings.fullRefundDays,
      reportCategories: categories,
      reportStatuses: statuses,
      minDetailsLength: config.reports.minDetailsLength,
      maxDetailsLength: config.reports.maxDetailsLength,
    });
  });

  router.get("/announcements", (req, res) => {
    const database = getDatabase();
    const today = todayIn(config.timezone);
    const active = database.closures
      .filter((closure) => closure.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((closure) => {
        const facility = database.facilities.find(
          (item) => item.id === closure.facilityId,
        );
        return {
          id: closure.id,
          facility: facility ? facility.name : "Facility",
          startDate: closure.startDate,
          endDate: closure.endDate,
          message: closure.message,
        };
      });
    res.json(active);
  });

  return router;
}

module.exports = { createMetaRouter };
