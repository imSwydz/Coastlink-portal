const crypto = require("crypto");

const sessionCookie = "coastlink_session";
const sessions = new Map();

function getCredentials() {
  return {
    email: process.env.COASTLINK_AUTH_EMAIL || "resident@example.com",
    password: process.env.COASTLINK_AUTH_PASSWORD || "coastlink-demo",
  };
}

function createSession(email) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { email, createdAt: Date.now() });
  return token;
}

function getSession(req) {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .filter(([name]) => name);
  const token = cookies.find(([name]) => name === sessionCookie)?.[1];
  return token ? sessions.get(token) : null;
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session)
    return res.status(401).json({ error: "authentication required" });
  req.user = session;
  return next();
}

function createAuthRouter() {
  const express = require("express");
  const router = express.Router();

  router.get("/me", (req, res) => {
    const session = getSession(req);
    return res.json({ authenticated: Boolean(session), user: session || null });
  });

  router.post("/login", (req, res) => {
    const { email, password } = req.body || {};
    const credentials = getCredentials();
    if (email !== credentials.email || password !== credentials.password) {
      return res.status(401).json({ error: "invalid email or password" });
    }
    const token = createSession(email);
    res.setHeader(
      "Set-Cookie",
      `${sessionCookie}=${token}; HttpOnly; Path=/; SameSite=Lax`,
    );
    return res.json({ authenticated: true, user: { email } });
  });

  router.post("/logout", (req, res) => {
    const cookies = String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim().split("="));
    const token = cookies.find(([name]) => name === sessionCookie)?.[1];
    if (token) sessions.delete(token);
    res.setHeader(
      "Set-Cookie",
      `${sessionCookie}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    );
    return res.status(204).end();
  });

  return router;
}

module.exports = { createAuthRouter, requireAuth };
