const assert = require("node:assert/strict");
const { createApp } = require("../src/server/app");
const { initialDatabase } = require("../src/server/db");
const { loadConfig } = require("../src/server/config");
const { todayIn, addDays } = require("../src/server/services/dates");

const timezone = loadConfig().timezone;
const today = () => todayIn(timezone);
const daysFromNow = (days) => addDays(today(), days);

function createTestServer({ config = {}, mutate } = {}) {
  const database = structuredClone(initialDatabase);
  if (mutate) mutate(database);
  const app = createApp({
    database,
    persist: () => {},
    config: { reports: { simulateProgress: false }, ...config },
  });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, database, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function request(server, path, options = {}) {
  const response = await fetch(`${server.baseUrl}${path}`, options);
  const text = response.status === 204 ? "" : await response.text();
  return { response, body: text ? JSON.parse(text) : null };
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

function authed(cookie, method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  };
}

module.exports = {
  createTestServer,
  request,
  authenticate,
  authed,
  today,
  daysFromNow,
};
