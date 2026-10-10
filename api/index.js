// Vercel routes /api/* requests here; use the Express app shared with local runs.
const { createApp } = require("../src/server/app");

module.exports = createApp();
