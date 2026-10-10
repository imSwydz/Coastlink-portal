const express = require("express");
const path = require("path");
const { createLocalStore, createStore } = require("./db");
const createFacilitiesRouter = require("./routes/facilities");
const { createBookingsRouter } = require("./routes/bookings");
const { createReportsRouter } = require("./routes/reports");
const { createAuthRouter, requireAuth } = require("./auth");

function createApp(options = {}) {
  const app = express();
  const store = options.database
    ? Promise.resolve(createLocalStore(options.database, options.persist))
    : createStore(options);
  const getStore = () => store;

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  app.use(express.json());
  app.get("/", (req, res) => res.redirect("/home.html"));
  app.use(express.static(path.join(__dirname, "dist")));
  app.use("/api/auth", createAuthRouter());

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "coastlink-portal",
      database: "connected",
    });
  });
  app.use("/api/facilities", createFacilitiesRouter(getStore));
  app.use("/api/bookings", requireAuth, createBookingsRouter(getStore));
  app.use("/api/reports", requireAuth, createReportsRouter(getStore));
  return app;
}

const app = createApp();

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`CoastLink Portal API listening on http://localhost:${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
