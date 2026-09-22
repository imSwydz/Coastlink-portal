const assert = require("node:assert/strict");
const test = require("node:test");
const { createApp } = require("../server");
const { initialDatabase } = require("../db");

function createTestServer() {
  const database = structuredClone(initialDatabase);
  const app = createApp({ database, persist: () => {} });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function request(server, path, options) {
  const response = await fetch(`${server.baseUrl}${path}`, options);
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
}

async function authenticate(server) {
  const response = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "resident@example.com",
      password: "coastlink-demo",
    }),
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie");
}

test("creates and cancels a booking", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const created = await request(server, "/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      facility: "Bayview Community Hall",
      date: "2026-10-01",
    }),
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.date, "2026-10-01");

  const cancelled = await request(server, `/api/bookings/${created.body.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.equal(cancelled.response.status, 204);
});

test("rejects invalid booking dates and unknown facilities", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

  const invalidDate = await request(server, "/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      facility: "Bayview Community Hall",
      date: "tomorrow",
    }),
  });
  assert.equal(invalidDate.response.status, 400);

  const unknownFacility = await request(server, "/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      facility: "<img src=x onerror=confirm(1)>",
      date: "2026-10-01",
    }),
  });
  assert.equal(unknownFacility.response.status, 400);
});

test("searches facilities by suburb and minimum capacity", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());
  const cookie = await authenticate(server);

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

  const report = await request(server, "/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      facility: "Civic Pavilion",
      category: "Electrical / Lighting",
      details: "The foyer lights are not working.",
    }),
  });
  assert.equal(report.response.status, 201);
  assert.match(String(report.body.ticketId), /^10\d{3}$/);

  const invalidReport = await request(server, "/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      facility: "Civic Pavilion",
      category: "Unsupported category",
      details: "A detailed issue description.",
    }),
  });
  assert.equal(invalidReport.response.status, 400);
});

test("requires authentication for bookings", async (t) => {
  const server = await createTestServer();
  t.after(() => server.server.close());

  const response = await request(server, "/api/bookings");
  assert.equal(response.response.status, 401);
});
