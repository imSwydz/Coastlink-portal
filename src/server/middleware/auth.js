const crypto = require("crypto");
const express = require("express");

const sessionCookie = "coastlink_session";

function safeEqual(a, b) {
  const left = crypto.createHash("sha256").update(String(a)).digest();
  const right = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

function readToken(req) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === sessionCookie) {
      return part.slice(index + 1).trim();
    }
  }
  return null;
}

function createSessionToken(email, createdAt, secret) {
  const payload = Buffer.from(JSON.stringify({ email, createdAt })).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token, secret, ttlMs) {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return null;
  }

  let session;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof session.email !== "string" ||
    !Number.isSafeInteger(session.createdAt)
  ) {
    return null;
  }
  const age = Date.now() - session.createdAt;
  return age >= 0 && age <= ttlMs ? session : null;
}

/**
 * Signed session cookies keep authentication valid across serverless instances.
 */
function createAuth(config) {
  const failures = new Map();

  function getSession(req) {
    const token = readToken(req);
    return token
      ? readSession(token, config.auth.sessionSecret, config.auth.sessionTtlMs)
      : null;
  }

  function cookie(value, maxAgeSeconds) {
    const secure = config.isProduction ? "; Secure" : "";
    return `${sessionCookie}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
  }

  function isLockedOut(ip) {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.firstAt > config.auth.lockoutMs) {
      failures.delete(ip);
      return false;
    }
    return entry.count >= config.auth.maxFailedLogins;
  }

  function recordFailure(ip) {
    const entry = failures.get(ip) || { count: 0, firstAt: Date.now() };
    entry.count += 1;
    failures.set(ip, entry);
  }

  function requireAuth(req, res, next) {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "authentication required" });
    }
    req.user = session;
    return next();
  }

  const router = express.Router();

  router.get("/me", (req, res) => {
    const session = getSession(req);
    const user = session ? { email: session.email } : null;
    res.json({ authenticated: Boolean(session), user });
  });

  router.post("/login", (req, res) => {
    if (isLockedOut(req.ip)) {
      return res
        .status(429)
        .json({ error: "too many failed attempts, try again later" });
    }
    const { email, password } = req.body || {};
    const valid =
      safeEqual(email ?? "", config.auth.email) &&
      safeEqual(password ?? "", config.auth.password);
    if (!valid) {
      recordFailure(req.ip);
      return res.status(401).json({ error: "invalid email or password" });
    }
    failures.delete(req.ip);
    const token = createSessionToken(
      email,
      Date.now(),
      config.auth.sessionSecret,
    );
    res.setHeader(
      "Set-Cookie",
      cookie(token, Math.floor(config.auth.sessionTtlMs / 1000)),
    );
    return res.json({ authenticated: true, user: { email } });
  });

  router.post("/logout", (req, res) => {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.status(204).end();
  });

  return { router, requireAuth };
}

module.exports = { createAuth };
