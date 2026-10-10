const fs = require("fs");
const path = require("path");
const { loadConfig } = require("./config");
const { createSeed, createClosures, facilities: seedFacilities } = require("./seed");
const { todayIn } = require("./services/dates");

const initialDatabase = createSeed();

/**
 * Brings any database (new, or saved by an older version of the app) up to
 * the current shape. It only ever adds missing fields, so existing bookings
 * and reports are never lost. Safe to run repeatedly.
 */
function normalizeDatabase(database, config = loadConfig()) {
  const owner = config.auth.email;
  const now = new Date().toISOString();

  database.facilities = Array.isArray(database.facilities)
    ? database.facilities
    : structuredClone(seedFacilities);
  database.facilities = database.facilities.map((facility) => {
    const seeded = seedFacilities.find((item) => item.id === facility.id);
    return { amenities: seeded ? seeded.amenities : [], ...facility };
  });

  database.bookings = (database.bookings || []).map((booking) => {
    const facility = database.facilities.find(
      (item) => item.name === booking.facility,
    );
    return {
      owner,
      facilityId: facility ? facility.id : null,
      createdAt: now,
      ...booking,
    };
  });

  database.reports = (database.reports || []).map((report) => ({
    owner,
    status: "Received",
    updatedAt: report.createdAt || now,
    ...report,
  }));

  database.notifications = database.notifications || [];
  database.closures =
    database.closures || createClosures(todayIn(config.timezone));
  return database;
}

function loadDatabase(file = loadConfig().dataFile) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(createSeed(), null, 2));
  }
  return normalizeDatabase(JSON.parse(fs.readFileSync(file, "utf8")));
}

function saveDatabase(database, file = loadConfig().dataFile) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(database, null, 2));
  fs.renameSync(temporaryFile, file);
}

module.exports = { initialDatabase, loadDatabase, saveDatabase, normalizeDatabase };
