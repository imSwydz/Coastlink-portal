const express = require("express");
const { loadConfig } = require("./config");
const { loadDatabase, saveDatabase, normalizeDatabase } = require("./db");
const { createAuth } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errors");
const createFacilitiesRouter = require("./routes/facilities");
const { createBookingsRouter } = require("./routes/bookings");
const { createReportsRouter } = require("./routes/reports");
const { createNotificationsRouter } = require("./routes/notifications");
const { createMetaRouter } = require("./routes/meta");

/**
 * Builds the Express app. Everything it depends on can be injected, which is
 * what the tests do (in-memory database, no disk writes).
 *   options.config    - overrides for src/server/config.js
 *   options.database  - a database object (defaults to the JSON file)
 *   options.persist   - function that saves the database
 */
function createApp(options = {}) {
  const config = loadConfig(options.config);
  const database = normalizeDatabase(
    options.database || loadDatabase(config.dataFile),
    config,
  );
  const persist =
    options.persist || ((data) => saveDatabase(data, config.dataFile));
  const getDatabase = () => database;
  const auth = createAuth(config);

  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.use(express.json({ limit: "10kb" }));
  app.get("/", (req, res) => res.redirect("/home.html"));
  app.use(express.static(config.distDirectory));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "coastlink-portal",
      database: "connected",
    });
  });
  app.use("/api/auth", auth.router);
  app.use("/api", createMetaRouter(getDatabase, config));
  app.use("/api/facilities", createFacilitiesRouter(getDatabase));
  app.use(
    "/api/bookings",
    auth.requireAuth,
    createBookingsRouter(getDatabase, persist, config),
  );
  app.use(
    "/api/reports",
    auth.requireAuth,
    createReportsRouter(getDatabase, persist, config),
  );
  app.use(
    "/api/notifications",
    auth.requireAuth,
    createNotificationsRouter(getDatabase, persist),
  );
  app.use("/api", notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
