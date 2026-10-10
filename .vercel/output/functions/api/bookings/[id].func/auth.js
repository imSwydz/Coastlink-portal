const crypto = require("crypto");

const sessionCookie = "coastlink_session";
const sessionDuration = 60 * 60 * 24 * 7;

function getCredentials() {
  if (
    process.env.VERCEL &&
    (!process.env.COASTLINK_AUTH_EMAIL || !process.env.COASTLINK_AUTH_PASSWORD)
  ) {
    throw new Error(
      "COASTLINK_AUTH_EMAIL and COASTLINK_AUTH_PASSWORD must be configured",
    );
  }
  return {
    email: process.env.COASTLINK_AUTH_EMAIL || "resident@example.com",
    password: process.env.COASTLINK_AUTH_PASSWORD || "coastlink-demo",
  };
}

function getSessionSecret() {
  if (process.env.VERCEL && !process.env.COASTLINK_SESSION_SECRET) {
    throw new Error("COASTLINK_SESSION_SECRET must be configured");
  }
  return (
    process.env.COASTLINK_SESSION_SECRET || "local-development-session-secret"
  );
}

function sign(value) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function createSession(email) {
  const payload = Buffer.from(
    JSON.stringify({ email, expiresAt: Date.now() + sessionDuration * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function getSession(req) {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .filter(([name]) => name);
  const token = cookies.find(([name]) => name === sessionCookie)?.[1];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
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
      `${sessionCookie}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionDuration}${process.env.VERCEL ? "; Secure" : ""}`,
    );
    return res.json({ authenticated: true, user: { email } });
  });

  router.post("/logout", (req, res) => {
    const cookies = String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim().split("="));
    const token = cookies.find(([name]) => name === sessionCookie)?.[1];
    res.setHeader(
      "Set-Cookie",
      `${sessionCookie}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.VERCEL ? "; Secure" : ""}`,
    );
    return res.status(204).end();
  });

  return router;
}

module.exports = { createAuthRouter, requireAuth };
