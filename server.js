const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- In-memory data store (prototype only — no real DB yet) ---
const facilities = [
  { id: 1, name: "Bayview Community Hall", type: "Hall", suburb: "Bayview", capacity: 80 },
  { id: 2, name: "North Beach Activity Room", type: "Room", suburb: "North Beach", capacity: 20 },
  { id: 3, name: "South Point Tennis Court", type: "Court", suburb: "South Point", capacity: 10 },
  { id: 4, name: "Civic Pavilion", type: "Hall", suburb: "North Beach", capacity: 150 },
];

let bookings = [
  { id: 1, facility: "South Point Tennis Court", date: "2026-09-12" },
];

let reports = [];
let nextBookingId = 2;
let nextReportId = 1;

// --- Facilities ---
app.get("/api/facilities", (req, res) => {
  const { q, suburb, minCapacity } = req.query;
  const term = (q || "").toLowerCase();
  const minCap = parseInt(minCapacity, 10) || 0;

  const results = facilities.filter((f) => {
    const matchesTerm = !term || f.name.toLowerCase().includes(term) || f.type.toLowerCase().includes(term);
    const matchesSuburb = !suburb || f.suburb === suburb;
    const matchesCapacity = !minCap || f.capacity >= minCap;
    return matchesTerm && matchesSuburb && matchesCapacity;
  });

  res.json(results);
});

// --- Bookings ---
app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

app.post("/api/bookings", (req, res) => {
  const { facility, date } = req.body;
  if (!facility) {
    return res.status(400).json({ error: "facility is required" });
  }
  const booking = { id: nextBookingId++, facility, date: date || "Upcoming" };
  bookings.push(booking);
  res.status(201).json(booking);
});

app.delete("/api/bookings/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = bookings.length;
  bookings = bookings.filter((b) => b.id !== id);
  if (bookings.length === before) {
    return res.status(404).json({ error: "booking not found" });
  }
  res.status(204).end();
});

// --- Maintenance reports ---
app.post("/api/reports", (req, res) => {
  const { facility, category, details } = req.body;
  if (!facility || !category || !details) {
    return res.status(400).json({ error: "facility, category and details are required" });
  }
  const ticketId = 10000 + nextReportId++;
  const report = { ticketId, facility, category, details, createdAt: new Date().toISOString() };
  reports.push(report);
  res.status(201).json({ ticketId });
});

app.get("/api/reports", (req, res) => {
  res.json(reports);
});

app.listen(PORT, () => {
  console.log(`CoastLink Portal API listening on http://localhost:${PORT}`);
});
