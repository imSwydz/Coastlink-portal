# CoastLink Council — Facility Portal

Built by **Team LFL**.

## The problem

Booking a council hall, sports court, or meeting room today usually means phoning
the council, waiting for a callback, and hoping the date you want is actually free —
with no way to check availability yourself first. Reporting a broken light or a
faulty door is just as manual, and once it's reported, residents have no way to
track what happens to it. CoastLink replaces both of these with a self-service
portal: search facilities by suburb and capacity, see what's actually available,
book it directly, and report maintenance issues with a trackable ticket — no phone
call required.

**Contents:** [Features](#features) · [Tech stack](#tech-stack) ·
[Getting started](#getting-started) · [Project structure](#project-structure) ·
[API reference](#api-reference) · [Status](#status) · [Team](#team-lfl)

---

## Features

| Feature | What it does |
| --- | --- |
| 🔍 **Facility search** | Live filtering by keyword, suburb, and capacity, with a "show all" fallback and quick-task shortcuts (book a hall, report a problem, check a booking) |
| 📅 **Booking flow** | Book a facility straight from search results, with availability checked against existing bookings |
| 📋 **My Bookings** | View and cancel existing reservations |
| 🛠️ **Report a Problem** | Maintenance request form (facility, issue category, details) that returns a generated ticket ID |
| ❓ **Help / FAQ** | Collapsible frequently-asked-questions section |
| 🔔 **Notifications** | In-app alerts for booking confirmations and report ticket updates |
| ♿ **Accessibility** | WCAG AA compliant — semantic markup, full keyboard support, and screen-reader-friendly live regions |

---

## Tech stack

- **Frontend:** inspired from nsw design system,  TypeScript
- **Backend:** Node.js, Express
- **Storage:** local JSON file (`data/coastlink.json`), with a swap to SQLite planned if concurrent usage requires it

---

## Getting started

**Prerequisites:** Node.js (with npm) installed.

```bash
npm install
npm run dev
```

This starts the Express API and the Vite dev server together. Then open
**http://localhost:3000** (API) — the Vite dev server will print its own local URL
for the frontend during development; production builds are served by Express directly.

> **Note:** run these commands from the project root (the folder containing
> `package.json`). If `npm run dev` can't find `package.json`, check you're not inside
> a duplicated/nested copy of the project folder.

---

## Project structure

```
Coastlink-portal/
├── data/
│   └── coastlink.json      # auto-created on first launch; stores bookings & reports
├── public/
│   ├── index.html            # markup
│   ├── base.css               # global resets + theme variables only
│   ├── components/            # one file per UI component (tabs, toast, notifications, etc.)
│   └── app.ts                  # entry point
├── routes/
│   ├── facilities.js
│   ├── bookings.js
│   └── reports.js
├── db.js                        # loadDatabase / saveDatabase
├── server.js                     # Express app setup, mounts routers
├── package.json
└── README.md
```

---

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/facilities` | List facilities (filter by `q`, `suburb`, `minCapacity`) |
| `GET` | `/api/facilities/:id/availability` | List dates already booked for a facility |
| `GET` | `/api/bookings` | List current user's bookings |
| `POST` | `/api/bookings` | Create a booking (`facility`, `date`) |
| `DELETE` | `/api/bookings/:id` | Cancel a booking |
| `POST` | `/api/reports` | Submit a maintenance report (`facility`, `category`, `details`) → returns a `ticketId` |
| `GET` | `/api/reports` | List submitted reports |
| `GET` | `/api/notifications` | List the current user's notifications |
| `GET` | `/api/health` | Check API and database status |

---

## Accessibility

Built against the project's [accessibility specification](./docs/accessibility-spec.md):
semantic tab/form markup, live regions for dynamic updates, full keyboard navigation,
visible focus states, and WCAG AA color contrast.

---

## Status

Rebuilt from an earlier prototype to fix structural and accessibility issues. The
front end calls the Express API for facility search, bookings, cancellations, and
maintenance reports; data persists in `data/coastlink.json` across restarts.

---

## Team LFL

| Name | Role |
| --- | --- |
| Kasparas Jancys | Project manager |
| Sadi Hasan | QA tester |
| Syed Hussain | UI/UX Designer |
| Swapnil Bhowmik | Lead Developer |
| Archie Small | Technical writer |
