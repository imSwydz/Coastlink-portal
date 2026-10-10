const { todayIn, addDays } = require("./services/dates");

const facilities = [
  { id: 1, name: "Bayview Community Hall", type: "Hall", suburb: "Bayview", capacity: 80, amenities: ["Kitchen", "Stage", "Accessible entry"] },
  { id: 2, name: "North Beach Activity Room", type: "Room", suburb: "North Beach", capacity: 20, amenities: ["Whiteboard", "Air conditioning"] },
  { id: 3, name: "South Point Tennis Court", type: "Court", suburb: "South Point", capacity: 10, amenities: ["Floodlights", "Net provided"] },
  { id: 4, name: "Civic Pavilion", type: "Hall", suburb: "North Beach", capacity: 150, amenities: ["Stage", "PA system", "Kitchen", "Accessible entry"] },
  { id: 5, name: "Harbourview Meeting Room", type: "Room", suburb: "Bayview", capacity: 12, amenities: ["Projector", "Video conferencing"] },
  { id: 6, name: "Seabreeze Sports Hall", type: "Hall", suburb: "South Point", capacity: 120, amenities: ["Sprung floor", "Change rooms", "Accessible entry"] },
  { id: 7, name: "North Beach Picnic Shelter", type: "Shelter", suburb: "North Beach", capacity: 30, amenities: ["BBQ", "Picnic tables"] },
  { id: 8, name: "Bayview Outdoor Court", type: "Court", suburb: "Bayview", capacity: 30, amenities: ["Floodlights", "Line markings"] },
  { id: 9, name: "South Point Community Room", type: "Room", suburb: "South Point", capacity: 40, amenities: ["Kitchenette", "Air conditioning"] },
  { id: 10, name: "Coastal Arts Studio", type: "Studio", suburb: "North Beach", capacity: 25, amenities: ["Sinks", "Easels", "Natural light"] },
];

/** A sample closure that always sits a few days ahead of "today". */
function createClosures(today) {
  return [
    {
      id: 1,
      facilityId: 1,
      startDate: addDays(today, 3),
      endDate: addDays(today, 5),
      message: "Floor repairs.",
    },
  ];
}

function createSeed(timezone = "Australia/Sydney") {
  const today = todayIn(timezone);
  return {
    facilities: structuredClone(facilities),
    bookings: [
      { id: 1, facility: "South Point Tennis Court", date: "2026-09-12" },
    ],
    reports: [],
    notifications: [],
    closures: createClosures(today),
  };
}

module.exports = { createSeed, createClosures, facilities };
