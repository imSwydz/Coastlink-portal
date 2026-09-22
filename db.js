const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "data");
const databaseFile = path.join(dataDirectory, "coastlink.json");

const initialDatabase = {
  facilities: [
    {
      id: 1,
      name: "Bayview Community Hall",
      type: "Hall",
      suburb: "Bayview",
      capacity: 80,
    },
    {
      id: 2,
      name: "North Beach Activity Room",
      type: "Room",
      suburb: "North Beach",
      capacity: 20,
    },
    {
      id: 3,
      name: "South Point Tennis Court",
      type: "Court",
      suburb: "South Point",
      capacity: 10,
    },
    {
      id: 4,
      name: "Civic Pavilion",
      type: "Hall",
      suburb: "North Beach",
      capacity: 150,
    },
  ],
  bookings: [
    { id: 1, facility: "South Point Tennis Court", date: "2026-09-12" },
  ],
  reports: [],
};

function loadDatabase() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, JSON.stringify(initialDatabase, null, 2));
  }
  return JSON.parse(fs.readFileSync(databaseFile, "utf8"));
}

function saveDatabase(database) {
  fs.mkdirSync(dataDirectory, { recursive: true });
  const temporaryFile = `${databaseFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(database, null, 2));
  fs.renameSync(temporaryFile, databaseFile);
}

module.exports = { initialDatabase, loadDatabase, saveDatabase };
