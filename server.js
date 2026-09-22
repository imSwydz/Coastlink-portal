const express = require("express");
const path = require("path");
const { loadDatabase, saveDatabase } = require("./db");
const createFacilitiesRouter = require("./routes/facilities");
const { createBookingsRouter } = require("./routes/bookings");
const { createReportsRouter } = require("./routes/reports");

function createApp(options = {}) {
  const app = express();
  const database = options.database || loadDatabase();
  const persist = options.persist || saveDatabase;
  const getDatabase = () => database;

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "coastlink-portal",
      database: "connected",
    });
  });
  app.use("/api/facilities", createFacilitiesRouter(getDatabase));
  app.use("/api/bookings", createBookingsRouter(getDatabase, persist));
  app.use("/api/reports", createReportsRouter(getDatabase, persist));
  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => {
    console.log(`CoastLink Portal API listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
