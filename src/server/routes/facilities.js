const express = require("express");
const { isValidDate } = require("../services/dates");
const { getUnavailableReason } = require("../services/availability");

function createFacilitiesRouter(getDatabase) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const { q, suburb, type, minCapacity, date } = req.query;
    if (date && !isValidDate(date)) {
      return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
    }
    const database = getDatabase();
    const term = String(q || "").toLowerCase();
    const minCap = parseInt(minCapacity, 10) || 0;

    const results = database.facilities
      .filter((facility) => {
        const matchesTerm =
          !term ||
          facility.name.toLowerCase().includes(term) ||
          facility.type.toLowerCase().includes(term) ||
          facility.suburb.toLowerCase().includes(term) ||
          (facility.amenities || []).some((item) =>
            item.toLowerCase().includes(term),
          );
        return (
          matchesTerm &&
          (!suburb || facility.suburb === suburb) &&
          (!type || facility.type === type) &&
          (!minCap || facility.capacity >= minCap)
        );
      })
      .map((facility) => {
        if (!date) return facility;
        const reason = getUnavailableReason(database, facility, date);
        return { ...facility, available: !reason, unavailableReason: reason };
      });
    res.json(results);
  });

  router.get("/:id", (req, res) => {
    const facility = getDatabase().facilities.find(
      (item) => item.id === parseInt(req.params.id, 10),
    );
    if (!facility) return res.status(404).json({ error: "facility not found" });
    return res.json(facility);
  });

  router.get("/:id/availability", (req, res) => {
    const database = getDatabase();
    const facility = database.facilities.find(
      (item) => item.id === parseInt(req.params.id, 10),
    );
    if (!facility) return res.status(404).json({ error: "facility not found" });
    return res.json({
      facilityId: facility.id,
      facility: facility.name,
      bookedDates: database.bookings
        .filter((booking) => booking.facility === facility.name)
        .map((booking) => booking.date)
        .sort(),
      closures: database.closures
        .filter((closure) => closure.facilityId === facility.id)
        .map(({ startDate, endDate, message }) => ({
          startDate,
          endDate,
          message,
        })),
    });
  });

  return router;
}

module.exports = createFacilitiesRouter;
