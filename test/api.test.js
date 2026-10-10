const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createTestServer,
  request,
  authenticate,
  authed,
  daysFromNow,
} = require("./helpers");

test("creates and cancels a booking", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);
  const date = daysFromNow(30);

  const created = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", { facility: "Bayview Community Hall", date }),
  );
  assert.equal(created.response.status, 201);
  assert.equal(created.body.date, date);

  const cancelled = await request(
    server,
    `/api/bookings/${created.body.id}`,
    authed(cookie, "DELETE"),
  );
  assert.equal(cancelled.response.status, 204);
});

test("rejects invalid booking dates and unknown facilities", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const invalidDate = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "Bayview Community Hall",
      date: "tomorrow",
    }),
  );
  assert.equal(invalidDate.response.status, 400);

  const unknownFacility = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "<img src=x onerror=confirm(1)>",
      date: daysFromNow(30),
    }),
  );
  assert.equal(unknownFacility.response.status, 400);
});

test("searches facilities by suburb and minimum capacity", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());

  const suburbResults = await request(server, "/api/facilities?q=Bayview");
  assert.equal(suburbResults.response.status, 200);
  assert.ok(suburbResults.body.length >= 3);
  assert.ok(
    suburbResults.body.every((facility) => facility.suburb === "Bayview"),
  );

  const capacityResults = await request(
    server,
    "/api/facilities?minCapacity=100",
  );
  assert.equal(capacityResults.response.status, 200);
  assert.ok(capacityResults.body.length >= 2);
  assert.ok(capacityResults.body.every((facility) => facility.capacity >= 100));
});

test("submits a report and rejects unsupported categories", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const report = await request(
    server,
    "/api/reports",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      category: "Electrical / Lighting",
      details: "The foyer lights are not working.",
    }),
  );
  assert.equal(report.response.status, 201);
  assert.match(String(report.body.ticketId), /^10\d{3}$/);

  const invalidReport = await request(
    server,
    "/api/reports",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      category: "Unsupported category",
      details: "A detailed issue description.",
    }),
  );
  assert.equal(invalidReport.response.status, 400);
});

test("requires authentication for bookings", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());

  const response = await request(server, "/api/bookings");
  assert.equal(response.response.status, 401);
});

test("session cookies work across app instances", async (t) => {
  const loginInstance = await createTestServer();
  const followUpInstance = await createTestServer();
  t.after(() => {
    loginInstance.server.close();
    followUpInstance.server.close();
  });

  const cookie = await authenticate(loginInstance);
  const bookings = await request(
    followUpInstance,
    "/api/bookings",
    authed(cookie, "GET"),
  );
  assert.equal(bookings.response.status, 200);
});

test("filters facilities by type and flags availability for a date", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);
  const date = daysFromNow(40);

  const halls = await request(server, "/api/facilities?type=Hall");
  assert.ok(halls.body.length >= 3);
  assert.ok(halls.body.every((facility) => facility.type === "Hall"));

  await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", { facility: "Civic Pavilion", date }),
  );
  const onDate = await request(server, `/api/facilities?date=${date}`);
  const civic = onDate.body.find((f) => f.name === "Civic Pavilion");
  const bayview = onDate.body.find((f) => f.name === "Bayview Community Hall");
  assert.equal(civic.available, false);
  assert.equal(civic.unavailableReason, "Booked");
  assert.equal(bayview.available, true);

  const badDate = await request(server, "/api/facilities?date=nope");
  assert.equal(badDate.response.status, 400);
});

test("lists booked dates and closures for one facility", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);
  const date = daysFromNow(45);
  await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", { facility: "Bayview Community Hall", date }),
  );

  const result = await request(server, "/api/facilities/1/availability");
  assert.equal(result.response.status, 200);
  assert.ok(result.body.bookedDates.includes(date));
  assert.ok(result.body.closures.length >= 1);

  const missing = await request(server, "/api/facilities/999/availability");
  assert.equal(missing.response.status, 404);
});

test("prevents double bookings and bookings on closed dates", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);
  const date = daysFromNow(20);
  const payload = { facility: "Seabreeze Sports Hall", date };

  const first = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", payload),
  );
  assert.equal(first.response.status, 201);
  const second = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", payload),
  );
  assert.equal(second.response.status, 409);

  const closureDate = server.database.closures[0].startDate;
  const closed = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "Bayview Community Hall",
      date: closureDate,
    }),
  );
  assert.equal(closed.response.status, 409);
  assert.match(closed.body.error, /closed/);
});

test("enforces the booking window (no past dates, max 6 months)", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const past = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      date: daysFromNow(-1),
    }),
  );
  assert.equal(past.response.status, 400);

  const tooFar = await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      date: daysFromNow(400),
    }),
  );
  assert.equal(tooFar.response.status, 400);

  const config = await request(server, "/api/config");
  assert.equal(config.response.status, 200);
  assert.equal(config.body.minBookingDate, daysFromNow(0));
  assert.ok(config.body.reportCategories.includes("Plumbing / Taps"));
});

test("bookings belong to the resident who made them", async (t) => {
  const server = await createTestServer({
    mutate: (database) =>
      database.bookings.push({
        id: 50,
        facility: "Civic Pavilion",
        facilityId: 4,
        date: daysFromNow(60),
        owner: "someone.else@example.com",
        createdAt: new Date().toISOString(),
      }),
  });
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const list = await request(server, "/api/bookings", authed(cookie, "GET"));
  assert.ok(list.body.every((b) => b.owner === "resident@example.com"));
  assert.ok(!list.body.some((b) => b.id === 50));

  const cancel = await request(
    server,
    "/api/bookings/50",
    authed(cookie, "DELETE"),
  );
  assert.equal(cancel.response.status, 404);
});

test("reports are listed per resident with a status", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const created = await request(
    server,
    "/api/reports",
    authed(cookie, "POST", {
      facility: "Coastal Arts Studio",
      category: "Plumbing / Taps",
      details: "The back sink is leaking.",
    }),
  );
  assert.equal(created.body.status, "Received");

  const list = await request(server, "/api/reports", authed(cookie, "GET"));
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].facility, "Coastal Arts Studio");

  const single = await request(
    server,
    `/api/reports/${created.body.ticketId}`,
    authed(cookie, "GET"),
  );
  assert.equal(single.response.status, 200);

  const tooLong = await request(
    server,
    "/api/reports",
    authed(cookie, "POST", {
      facility: "Coastal Arts Studio",
      category: "Plumbing / Taps",
      details: "x".repeat(1001),
    }),
  );
  assert.equal(tooLong.response.status, 400);
});

test("ticket status advances over time and notifies the resident", async (t) => {
  const server = await createTestServer({
    config: {
      reports: { simulateProgress: true, progressAfterSeconds: [1, 2, 3] },
    },
  });
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  await request(
    server,
    "/api/reports",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      category: "Locks / Access",
      details: "Side door will not lock.",
    }),
  );
  server.database.reports[0].createdAt = new Date(
    Date.now() - 10000,
  ).toISOString();

  const list = await request(server, "/api/reports", authed(cookie, "GET"));
  assert.equal(list.body[0].status, "Resolved");

  const notes = await request(
    server,
    "/api/notifications",
    authed(cookie, "GET"),
  );
  assert.ok(notes.body.some((n) => /resolved/i.test(n.message)));
});

test("notifications are created by actions and can be marked read", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  await request(
    server,
    "/api/bookings",
    authed(cookie, "POST", {
      facility: "Civic Pavilion",
      date: daysFromNow(25),
    }),
  );
  const before = await request(
    server,
    "/api/notifications",
    authed(cookie, "GET"),
  );
  assert.equal(before.body.length, 1);
  assert.equal(before.body[0].read, false);

  const marked = await request(
    server,
    "/api/notifications/read",
    authed(cookie, "POST"),
  );
  assert.equal(marked.response.status, 204);
  const after = await request(
    server,
    "/api/notifications",
    authed(cookie, "GET"),
  );
  assert.equal(after.body[0].read, true);

  const anonymous = await request(server, "/api/notifications");
  assert.equal(anonymous.response.status, 401);
});

test("announcements list upcoming closures", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const result = await request(server, "/api/announcements");
  assert.equal(result.response.status, 200);
  assert.equal(result.body[0].facility, "Bayview Community Hall");
});

test("login locks out repeated failures and logout clears the session cookie", async (t) => {
  const server = await createTestServer({
    config: { auth: { maxFailedLogins: 3 } },
  });
  t.after(() => server.server.close());
  const bad = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "resident@example.com", password: "wrong" }),
  };

  for (let i = 0; i < 3; i += 1) {
    const attempt = await request(server, "/api/auth/login", bad);
    assert.equal(attempt.response.status, 401);
  }
  const locked = await request(server, "/api/auth/login", bad);
  assert.equal(locked.response.status, 429);

  const other = await createTestServer();
  t.after(() => other.server.close());
  const cookie = await authenticate(other);
  const logout = await request(
    other,
    "/api/auth/logout",
    authed(cookie, "POST"),
  );
  assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);
  const anonymous = await request(other, "/api/bookings");
  assert.equal(anonymous.response.status, 401);
});

test("returns JSON errors for bad bodies and unknown API routes", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const badJson = await fetch(`${server.baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: "{not json",
  });
  assert.equal(badJson.status, 400);

  const unknown = await request(server, "/api/does-not-exist");
  assert.equal(unknown.response.status, 404);
});
