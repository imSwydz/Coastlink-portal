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

No build tools needed — just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Status

Data is currently held in-memory on the client (`facilities` and `userBookings` arrays in
`index.html`). Next step is connecting this to the database schema from the Database Design
task before starting the Maintenance System Component.

## Team LFL

- Kasparas Jancys — Project manager
- Sadi Hasan — QA tester
- Syed Hussain — UI/UX Designer
- Swapnil Bhowmik — Lead Developer
- Archie Small — Technical writer
