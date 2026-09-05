# CoastLink Council — Facility Portal

Front-end prototype for the Booking System Component of the CoastLink Council facility
management project (Team LFL). Built as a single-page HTML/CSS/JS app — no build step or
dependencies required.

## Features

- **Facility search** — filter by keyword, suburb, and capacity, plus a "show all" fallback
  and quick-task shortcuts (book a hall, report a problem, check a booking)
- **Booking flow** — book a facility from search results and land on "My Bookings"
- **My Bookings** — view and cancel existing reservations
- **Report a Problem** — maintenance request form (facility, issue category, details) that
  returns a generated ticket ID
- **Help / FAQ** — collapsible frequently-asked-questions section
- **Accessibility** — adjustable text size control

## Running it

This now has a small Node/Express backend serving the front-end and a REST API.

```bash
npm install
npm start
```

Then visit `http://localhost:3000`.

### API

| Method | Endpoint             | Description                          |
|--------|-----------------------|---------------------------------------|
| GET    | `/api/facilities`     | List facilities (filter by `q`, `suburb`, `minCapacity`) |
| GET    | `/api/bookings`       | List current bookings                 |
| POST   | `/api/bookings`       | Create a booking (`facility`, `date`) |
| DELETE | `/api/bookings/:id`   | Cancel a booking                      |
| POST   | `/api/reports`        | Submit a maintenance report (`facility`, `category`, `details`), returns a `ticketId` |
| GET    | `/api/reports`        | List submitted reports                |

## Status

Data is currently held in-memory on the server (facilities, bookings, and reports reset on
restart). The front-end (`public/index.html`) still uses its own local sample data rather than
calling these endpoints — wiring it up to the API is the next step, followed by connecting the
API to the real database schema from the Database Design task.

## Team LFL

- Kasparas Jancys — Project manager
- Sadi Hasan — QA tester
- Syed Hussain — UI/UX Designer
- Swapnil Bhowmik — Lead Developer
- Archie Small — Technical writer
