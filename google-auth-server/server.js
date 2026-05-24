require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5500,http://localhost:5501,http://127.0.0.1:5500,http://127.0.0.1:5501"
).split(",");

const app = express();

let nodemailer = null;
let firebaseAdmin = null;
const crypto = require("crypto");

// simple in-memory OTP store
const otpStore = new Map();

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

// Parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  // Allow explicit origins from config, or allow all for file:///no-origin (local dev)
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
// Simple request logger for debugging network issues
app.use(function (req, res, next) {
  try {
    console.log(
      "REQ",
      req.method,
      req.originalUrl,
      "Origin:",
      req.headers.origin,
    );
  } catch (e) {
    console.log("REQ logging failed", e && e.message);
  }
  next();
});
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

// Attempt to load optional modules/config for emails and firebase
try {
  nodemailer = require("nodemailer");
} catch (err) {
  console.warn("nodemailer not available; emails will be logged to console");
}

try {
  firebaseAdmin = require("firebase-admin");
  const hasAdminConfig =
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.FIREBASE_PROJECT_ID;

  if (hasAdminConfig && !firebaseAdmin.apps.length) {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
          "base64",
        ).toString("utf8"),
      );
      credential = firebaseAdmin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      credential = firebaseAdmin.credential.cert(
        require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
      );
    } else {
      credential = firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n",
        ),
      });
    }
    firebaseAdmin.initializeApp({ credential });
    console.log("Firebase Admin initialized");
  }
} catch (err) {
  console.warn(
    "firebase-admin is not installed or not configured. Password reset OTP final step will be unavailable.",
  );
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(email, otp, purpose) {
  return crypto
    .createHmac(
      "sha256",
      process.env.OTP_SECRET ||
        process.env.SESSION_SECRET ||
        "urban-track-dev-secret",
    )
    .update(`${purpose}:${normalizeEmail(email)}:${otp}`)
    .digest("hex");
}

function storeOtp(email, otp, purpose) {
  otpStore.set(`${purpose}:${normalizeEmail(email)}`, {
    hash: hashOtp(email, otp, purpose),
    expiresAt:
      Date.now() + Number(process.env.OTP_TTL_MINUTES || 10) * 60 * 1000,
    attempts: 0,
  });
}

function validateOtp(email, otp, purpose, consume = true) {
  const key = `${purpose}:${normalizeEmail(email)}`;
  const record = otpStore.get(key);
  if (!record)
    return { ok: false, message: "OTP not found. Please request a new code." };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { ok: false, message: "OTP expired. Please request a new code." };
  }
  if (record.attempts >= 5) {
    otpStore.delete(key);
    return {
      ok: false,
      message: "Too many attempts. Please request a new code.",
    };
  }
  record.attempts += 1;
  if (record.hash !== hashOtp(email, otp, purpose)) {
    return { ok: false, message: "Invalid OTP code." };
  }
  if (consume) otpStore.delete(key);
  return { ok: true };
}

function getTransporter() {
  if (!nodemailer) return null;
  if (!process.env.SMTP_HOST)
    return nodemailer.createTransport({ jsonTransport: true });
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    tls:
      process.env.SMTP_ALLOW_INSECURE === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

async function sendEmail({ to, subject, text, html }) {
  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_USER ||
    "UrbanTrack <no-reply@urbantrack.local>";
  const message = { from, to, subject, text, html };
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email fallback:", message);
    return { preview: "console" };
  }
  const info = await transporter.sendMail(message);
  if (info.message) console.log("Email json transport:", info.message);
  return info;
}

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    },
  ),
);

// Session handling
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Start Google login
app.get(
  "/auth/google",
  function (req, res, next) {
    console.log("Google auth initiated from:", req.headers.referer);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Callback after Google login
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL =
  process.env.FRONTEND_LOGIN_URL ||
  "http://localhost:5501/UrbanTrack/pages/login.html";

app.get(
  "/auth/google/callback",
  function (req, res, next) {
    console.log("Google callback received, query:", req.query);
    next();
  },
  passport.authenticate("google", {
    failureRedirect: FRONTEND_LOGIN_URL,
  }),
  function (req, res) {
    console.log(
      "Google auth successful, user:",
      req.user ? req.user.displayName : "no user",
    );
    console.log("Google auth successful, redirecting to", FRONTEND_URL);

    // Store user data in session and send as query params
    if (req.user) {
      const userData = JSON.stringify({
        name: req.user.displayName,
        email: req.user.emails[0]?.value,
        id: req.user.id,
        picture: req.user.photos[0]?.value,
        role: "user",
      });
      res.redirect(
        FRONTEND_URL + "?googleUser=" + encodeURIComponent(userData),
      );
    } else {
      res.redirect(FRONTEND_URL);
    }
  },
);

// Test endpoint to simulate successful auth
app.get("/auth/test", function (req, res) {
  console.log("Test auth endpoint called, redirecting to", FRONTEND_URL);
  res.redirect(FRONTEND_URL);
});

// Get logged-in user (for your frontend)
app.get("/auth/user", function (req, res) {
  res.json(req.user || null);
});

// Email / OTP endpoints
app.post("/api/email/password-otp", async function (req, res) {
  try {
    console.log("POST /api/email/password-otp", {
      contentType: req.headers["content-type"],
      bodyKeys: req.body ? Object.keys(req.body) : null,
    });
    const email = normalizeEmail(req.body?.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Valid email is required." });
    const otp = createOtp();
    storeOtp(email, otp, "password");
    await sendEmail({
      to: email,
      subject: "Your UrbanTrack password reset OTP",
      text: `Your UrbanTrack password reset OTP is ${otp}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`,
      html: `<p>Your UrbanTrack password reset OTP is <strong>${otp}</strong>.</p>`,
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Password OTP error:", error);
    res.status(500).json({ error: "Could not send password reset OTP." });
  }
});

app.post("/api/email/verify-password-otp", function (req, res) {
  const result = validateOtp(req.body.email, req.body.otp, "password", false);
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.json({ ok: true });
});

app.post("/api/email/reset-password", async function (req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const result = validateOtp(email, req.body.otp, "password", false);
    if (!result.ok) return res.status(400).json({ error: result.message });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    if (!firebaseAdmin || !firebaseAdmin.apps.length) {
      return res
        .status(500)
        .json({ error: "Firebase Admin is not configured on the server." });
    }
    const user = await firebaseAdmin.auth().getUserByEmail(email);
    await firebaseAdmin.auth().updateUser(user.uid, { password });
    otpStore.delete(`password:${email}`);
    res.json({ ok: true });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Could not reset password." });
  }
});

// Start server
app.listen(3000, function () {
  console.log("Server running on http://localhost:3000");
});
