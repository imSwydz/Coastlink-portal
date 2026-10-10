const path = require("path");

const rootDirectory = path.join(__dirname, "..", "..");

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function merge(base, overrides) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides || {})) {
    result[key] =
      isPlainObject(value) && isPlainObject(base[key])
        ? merge(base[key], value)
        : value;
  }
  return result;
}

/**
 * Every tunable value lives here so rules can change without touching routes.
 * Pass `overrides` (used by the tests) to change any value.
 */
function loadConfig(overrides = {}) {
  const env = process.env;
  const defaults = {
    port: Number(env.PORT) || 3000,
    isProduction: env.NODE_ENV === "production",
    timezone: env.COASTLINK_TIMEZONE || "Australia/Sydney",
    dataFile:
      env.COASTLINK_DATA_FILE ||
      (env.VERCEL
        ? "/tmp/coastlink.json"
        : path.join(rootDirectory, "data", "coastlink.json")),
    distDirectory: path.join(rootDirectory, "dist"),
    auth: {
      email: env.COASTLINK_AUTH_EMAIL || "resident@example.com",
      password: env.COASTLINK_AUTH_PASSWORD || "coastlink-demo",
      sessionTtlMs: 8 * 60 * 60 * 1000,
      maxFailedLogins: 10,
      lockoutMs: 15 * 60 * 1000,
    },
    bookings: {
      maxAdvanceMonths: 6,
      minNoticeDays: 0,
      fullRefundDays: 7,
    },
    reports: {
      minDetailsLength: 5,
      maxDetailsLength: 1000,
      // Demo only: tickets move through the statuses over time so the
      // tracking UI can be shown without a staff back office.
      simulateProgress: env.COASTLINK_TICKET_SIMULATION !== "off",
      progressAfterSeconds: [20, 60, 150],
    },
  };
  return merge(defaults, overrides);
}

module.exports = { loadConfig, rootDirectory };
