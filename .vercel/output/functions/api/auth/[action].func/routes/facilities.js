const express = require("express");

function createFacilitiesRouter(getDatabase) {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const store = await getDatabase();
      const facilities = await store.getFacilities();
      const { q, suburb, minCapacity } = req.query;
      const term = String(q || "").toLowerCase();
      const minCap = parseInt(minCapacity, 10) || 0;
      const results = facilities.filter((facility) => {
        const matchesTerm =
          !term ||
          facility.name.toLowerCase().includes(term) ||
          facility.type.toLowerCase().includes(term) ||
          facility.suburb.toLowerCase().includes(term);
        return (
          matchesTerm &&
          (!suburb || facility.suburb === suburb) &&
          (!minCap || facility.capacity >= minCap)
        );
      });
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createFacilitiesRouter;
