# CoastLink Council — Facility Portal

Built by **Team LFL**.

## The problem

Booking a council hall, sports court, or meeting room today usually means phoning
the council, waiting for a callback, and hoping the date you want is actually free.
Reporting a broken light or a faulty door is just as manual, and once it is reported,
residents have no way to track what happens to it. CoastLink replaces both with a
self-service portal: search facilities, see what is free on your date, book it
directly, and report maintenance issues with a trackable ticket.

## Features

| Feature          | What it does                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sign in          | Demo resident account with a session cookie; booking, report and notification data is private to the signed-in resident |
| Facility search  | Live filtering by keyword (name, type, suburb, amenity), suburb, type and capacity                                      |
| Availability     | Choose a date and every result shows Available, Booked or Closed                                                        |
| Booking          | Booked from the results; double bookings and closed dates are rejected; dates limited to today up to 6 months ahead     |
| My Bookings      | Upcoming and past bookings, cancel with a confirm step, refund-by date shown                                            |
| Report a Problem | Form with all facilities and categories from the server; returns a ticket ID                                            |
| My reports       | Ticket list with a status tracker (Received, Triaged, In progress, Resolved) that updates automatically                 |
| Notifications    | Saved on the server: booking confirmed or cancelled, ticket received and status changes                                 |
| Closure notices  | Shown from data, not hard-coded text                                                                                    |
| Dashboard        | Upcoming bookings, open reports and facility count at a glance                                                          |
| Help / FAQ       | Searchable, collapsible questions                                                                                       |

> **Demo behaviour:** there is no staff back office yet, so ticket statuses advance
> automatically with time (about 20s, 60s and 150s after submitting). Turn this off with
> `COASTLINK_TICKET_SIMULATION=off`.

## Tech stack

- **Front end:** TypeScript, Vite, SCSS, styled after the NSW Design System
- **Back end:** Node.js, Express
- **Storage:** local JSON file (`data/coastlink.json`, created on first launch)
- **Tests:** Node's built-in test runner

## Getting started

Requires Node.js 20.19+ (22 recommended) and npm.

```bash
git clone https://github.com/imSwydz/Coastlink-portal.git
cd Coastlink-portal
npm install
npm start
```

Open http://localhost:3000 and sign in (details are pre-filled):
`resident@example.com` / `coastlink-demo`.

| Command         | What it does                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm start`     | Type-check, build the front end into `dist/`, then start the server                                              |
| `npm run dev`   | Development: API on :3000 plus the Vite dev server with hot reload (open the URL Vite prints, then `/home.html`) |
| `npm run build` | Type-check and build only                                                                                        |
| `npm run serve` | Start the server without rebuilding                                                                              |
| `npm test`      | Run the API tests                                                                                                |

### Settings (environment variables)

| Variable                                           | Default                                   | Purpose                                               |
| -------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `PORT`                                             | `3000`                                    | Server port                                           |
| `COASTLINK_AUTH_EMAIL` / `COASTLINK_AUTH_PASSWORD` | `resident@example.com` / `coastlink-demo` | Demo login                                            |
| `COASTLINK_SESSION_SECRET`                         | development-only default                  | Signs sessions; set a long random value in production |
| `COASTLINK_TIMEZONE`                               | `Australia/Sydney`                        | Decides what "today" is for booking rules             |
| `COASTLINK_DATA_FILE`                              | `data/coastlink.json`                     | Where data is saved                                   |
| `COASTLINK_TICKET_SIMULATION`                      | on                                        | Set to `off` to stop tickets advancing on their own   |

To reset the data, stop the server and delete `data/coastlink.json`.
Booking rules (6 months ahead, refund days, and so on) are in `src/server/config.js`.

## Deploying to Vercel

Import the GitHub repository into Vercel and deploy with the default build settings
from `vercel.json`. Set `COASTLINK_SESSION_SECRET` to a long random value. You can
also set `COASTLINK_AUTH_EMAIL` and `COASTLINK_AUTH_PASSWORD` to change the demo
login.

Vercel's function filesystem is read-only except for temporary storage, so the JSON
data file uses `/tmp` when running there. Data can reset when an instance restarts,
and separate instances do not share bookings or reports. Sessions are also held in
memory, so a resident may need to sign in again if a request reaches another
instance. This setup is suitable for a demo; production use needs shared persistent
storage and a shared session store.

## Project structure

```
Coastlink-portal/
├── src/
│   ├── server/
│   │   ├── index.js          # starts the server
│   │   ├── app.js            # builds the Express app (dependencies can be injected)
│   │   ├── config.js         # every setting and business rule in one place
│   │   ├── db.js, seed.js    # JSON storage, seed data, upgrades older data files
│   │   ├── middleware/       # auth (sessions, login lockout), error handling
│   │   ├── routes/           # facilities, bookings, reports, notifications, meta
│   │   └── services/         # rules shared by routes: dates, availability, tickets, notifications
│   └── client/               # Vite root
│       ├── index.html        # portal page
│       ├── home.html         # landing page and sign in
│       ├── public/           # static files (logo)
│       └── src/
│           ├── portal.ts     # entry point that wires everything together
│           ├── api.ts        # one typed function per API endpoint
│           ├── features/     # search, bookings, reports, summary, announcements, faq
│           ├── components/   # toast, tabs, notifications
│           └── styles/
├── test/                     # API tests
├── data/                     # saved data (git-ignored)
└── .github/workflows/ci.yml  # build and test on every push
```

To add a feature, add a route in `src/server/routes`, a matching function in
`src/client/src/api.ts`, and a file in `src/client/src/features`.

## API reference

Routes marked **auth** need a signed-in session. Residents only ever see their own data.

| Method        | Endpoint                              | Description                                                                         |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `POST`        | `/api/auth/login`, `/api/auth/logout` | Sign in or out                                                                      |
| `GET`         | `/api/auth/me`                        | Current session                                                                     |
| `GET`         | `/api/config`                         | Booking window, report categories and statuses                                      |
| `GET`         | `/api/announcements`                  | Current and upcoming closures                                                       |
| `GET`         | `/api/facilities`                     | List; filter by `q`, `suburb`, `type`, `minCapacity`; add `date` to get `available` |
| `GET`         | `/api/facilities/:id`                 | One facility                                                                        |
| `GET`         | `/api/facilities/:id/availability`    | Booked dates and closures                                                           |
| `GET`, `POST` | `/api/bookings`                       | **auth** List own bookings; create (`facility`, `date`). `409` if booked or closed  |
| `DELETE`      | `/api/bookings/:id`                   | **auth** Cancel own booking                                                         |
| `GET`, `POST` | `/api/reports`                        | **auth** List own reports; submit (`facility`, `category`, `details`)               |
| `GET`         | `/api/reports/:ticketId`              | **auth** One report with status                                                     |
| `GET`         | `/api/notifications`                  | **auth** Own notifications                                                          |
| `POST`        | `/api/notifications/read`             | **auth** Mark all as read                                                           |
| `GET`         | `/api/health`                         | Health check                                                                        |

## Known limitations

- One demo login; passwords are not hashed. Signed sessions work across serverless
  instances but cannot be revoked before they expire.
- No payments, email or SMS. FAQ policies (insurance, refunds) are text only.
- Bookings are one date per booking, with no time slots.
- No staff or admin side; ticket status changes are simulated.
- JSON file storage is for a single server process.
- Not yet checked on mobile browsers, and no formal accessibility audit.

## Suggested next steps

1. Replace the JSON file with SQLite or PostgreSQL (only `src/server/db.js` and the routes change).
2. Real accounts: registration, hashed passwords, a shared session store.
3. Time slots and a staff view to manage tickets.
4. Add ESLint and Prettier, and browser tests (Playwright).

## Team LFL

| Name            | Role             |
| --------------- | ---------------- |
| Kasparas Jancys | Project manager  |
| Sadi Hasan      | QA tester        |
| Syed Hussain    | UI/UX Designer   |
| Swapnil Bhowmik | Lead Developer   |
| Archie Small    | Technical writer |
