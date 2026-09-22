const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
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

let database = loadDatabase();

function saveDatabase() {
  const temporaryFile = `${databaseFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(database, null, 2));
  fs.renameSync(temporaryFile, databaseFile);
}

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

// --- Facilities ---
app.get("/api/facilities", (req, res) => {
  const { q, suburb, minCapacity } = req.query;
  const term = (q || "").toLowerCase();
  const minCap = parseInt(minCapacity, 10) || 0;

  const results = database.facilities.filter((f) => {
    const matchesTerm =
      !term ||
      f.name.toLowerCase().includes(term) ||
      f.type.toLowerCase().includes(term);
    const matchesSuburb = !suburb || f.suburb === suburb;
    const matchesCapacity = !minCap || f.capacity >= minCap;
    return matchesTerm && matchesSuburb && matchesCapacity;
  });

  res.json(results);
});

// --- Bookings ---
app.get("/api/bookings", (req, res) => {
  res.json(database.bookings);
});

app.post("/api/bookings", (req, res) => {
  const { facility, date } = req.body;
  if (!facility) {
    return res.status(400).json({ error: "facility is required" });
  }
  const booking = {
    id:
      database.bookings.reduce((maxId, item) => Math.max(maxId, item.id), 0) +
      1,
    facility,
    date: date || "Upcoming",
  };
  database.bookings.push(booking);
  saveDatabase();
  res.status(201).json(booking);
});

app.delete("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = database.bookings.length;
  database.bookings = database.bookings.filter((b) => b.id !== id);
  if (database.bookings.length === before) {
    return res.status(404).json({ error: "booking not found" });
  }
  saveDatabase();
  res.status(204).end();
});

// --- Maintenance reports ---
app.post("/api/reports", (req, res) => {
  const { facility, category, details } = req.body;
  if (!facility || !category || !details) {
    return res
      .status(400)
      .json({ error: "facility, category and details are required" });
  }
  const ticketId =
    10000 +
    database.reports.reduce(
      (maxId, item) => Math.max(maxId, item.ticketId - 10000),
      0,
    ) +
    1;
  const report = {
    ticketId,
    facility,
    category,
    details,
    createdAt: new Date().toISOString(),
  };
  database.reports.push(report);
  saveDatabase();
  res.status(201).json({ ticketId });
});

app.get("/api/reports", (req, res) => {
  res.json(database.reports);
});

app.listen(PORT, () => {
  console.log(`CoastLink Portal API listening on http://localhost:${PORT}`);
});
