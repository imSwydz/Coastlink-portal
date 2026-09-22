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
    {
      id: 5,
      name: "Harbourview Meeting Room",
      type: "Room",
      suburb: "Bayview",
      capacity: 12,
    },
    {
      id: 6,
      name: "Seabreeze Sports Hall",
      type: "Hall",
      suburb: "South Point",
      capacity: 120,
    },
    {
      id: 7,
      name: "North Beach Picnic Shelter",
      type: "Shelter",
      suburb: "North Beach",
      capacity: 30,
    },
    {
      id: 8,
      name: "Bayview Outdoor Court",
      type: "Court",
      suburb: "Bayview",
      capacity: 30,
    },
    {
      id: 9,
      name: "South Point Community Room",
      type: "Room",
      suburb: "South Point",
      capacity: 40,
    },
    {
      id: 10,
      name: "Coastal Arts Studio",
      type: "Studio",
      suburb: "North Beach",
      capacity: 25,
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
