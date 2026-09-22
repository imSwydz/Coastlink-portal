# CoastLink Council — Facility Portal

CoastLink Council facility booking and maintenance portal (Team LFL). The app includes a
single-page HTML/CSS/JS interface, an Express backend, and a persistent local JSON database.

## Features

- **Facility search** — filter by keyword, suburb, and capacity, plus a "show all" fallback
  and quick-task shortcuts (book a hall, report a problem, check a booking)
- **Booking flow** — book a facility from search results and land on "My Bookings"
- **My Bookings** — view and cancel existing reservations
- **Report a Problem** — maintenance request form (facility, issue category, details) that
  returns a generated ticket ID
- **Help / FAQ** — collapsible frequently-asked-questions section
- **Accessibility** — semantic labels, keyboard-friendly controls, and readable contrast

## Running it

This has a Node/Express backend serving the front-end and a REST API. The backend creates
`data/coastlink.json` automatically and saves bookings and maintenance reports there.

```bash
npm install
npm start
```

Then visit `http://localhost:3000`.

The app has one HTML entrypoint: `public/index.html`, served by the Express backend.

### Project structure

- `server.js` — starts Express and mounts the API routes
- `db.js` — loads and saves the demo JSON database
- `routes/` — facility, booking, and maintenance report endpoints
- `public/` — markup, styles, and browser behavior in separate files
- `test/` — API regression tests using an in-memory database

The JSON file is appropriate for this demonstration because it keeps setup simple
and makes the persisted sample data easy to inspect. If this becomes a multi-user
service, migrate the same route contract to SQLite first for transactions and
concurrent access, then to a managed relational database if it needs to scale
beyond one application process.

Bookings require an existing facility and a `YYYY-MM-DD` date. Maintenance reports
accept only the issue categories shown in the form and require a description of at
least five characters.

### API

| Method | Endpoint            | Description                                                                           |
| ------ | ------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/api/facilities`   | List facilities (filter by `q`, `suburb`, `minCapacity`)                              |
| GET    | `/api/bookings`     | List current bookings                                                                 |
| POST   | `/api/bookings`     | Create a booking (`facility`, `date`)                                                 |
| DELETE | `/api/bookings/:id` | Cancel a booking                                                                      |
| POST   | `/api/reports`      | Submit a maintenance report (`facility`, `category`, `details`), returns a `ticketId` |
| GET    | `/api/reports`      | List submitted reports                                                                |
| GET    | `/api/health`       | Check API and database status                                                         |

## Status

The front-end calls the Express API for facility search, bookings, cancellations, and maintenance
reports. Data is stored in `data/coastlink.json`, so bookings and reports persist when the server
restarts. The file is created with the initial facility data on first launch.

## Team LFL

- Kasparas Jancys — Project manager
- Sadi Hasan — QA tester
- Syed Hussain — UI/UX Designer
- Swapnil Bhowmik — Lead Developer
- Archie Small — Technical writer
