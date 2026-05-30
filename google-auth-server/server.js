const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "UrbanTrack", "google-auth-server", ".env"),
});

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:5500,http://localhost:5501,http://127.0.0.1:5500,http://127.0.0.1:5501,null"
)
  .split(",")
  .map((item) => item.trim());

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch (error) {
    return false;
  }
}

const app = express();

let nodemailer = null;
let firebaseAdmin = null;
const crypto = require("crypto");

// simple in-memory OTP store
const otpStore = new Map();

function applyCors(req, res, next) {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

app.use(applyCors);
app.options(/.*/, applyCors);

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
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

// Attempt to load optional modules/config for emails and firebase
try {
  nodemailer = require("nodemailer");
} catch (err) {
  console.warn("nodemailer not available; emails will be logged to console");
}

const fs = require("fs");
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
      try {
        const serviceAccountPath = path.resolve(
          __dirname,
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim(),
        );
        const serviceAccountJson = fs.readFileSync(serviceAccountPath, "utf8");
        const serviceAccount = JSON.parse(serviceAccountJson);
        credential = firebaseAdmin.credential.cert(serviceAccount);
      } catch (innerError) {
        console.error(
          "Failed to load Firebase service account JSON:",
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
          innerError,
        );
        throw innerError;
      }
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
  console.error("Firebase Admin initialization failed:", err);
  console.warn(
    "firebase-admin is not installed or not configured. Password reset OTP final step will be unavailable.",
  );
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function otpEmailHtml(title, otp) {
  return `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
            <h2>${title}</h2>
            <p>Your UrbanTrack verification code is:</p>
            <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
            <p>This code expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>
        </div>
    `;
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
app.post("/api/email/signup-otp", async function (req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email))
      return res.status(400).json({ error: "Valid email is required." });

    const otp = createOtp();
    storeOtp(email, otp, "signup");

    await sendEmail({
      to: email,
      subject: "Your UrbanTrack signup OTP",
      text: `Your UrbanTrack signup OTP is ${otp}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`,
      html: otpEmailHtml("Confirm your UrbanTrack email", otp),
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Signup OTP error:", error);
    res.status(500).json({ error: "Could not send signup OTP." });
  }
});

app.post("/api/email/verify-signup-otp", function (req, res) {
  const result = validateOtp(req.body.email, req.body.otp, "signup");
  if (!result.ok) return res.status(400).json({ error: result.message });
  res.json({ ok: true });
});

app.post("/api/email/password-otp", async function (req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email))
      return res.status(400).json({ error: "Valid email is required." });

    const otp = createOtp();
    storeOtp(email, otp, "password");

    await sendEmail({
      to: email,
      subject: "Your UrbanTrack password reset OTP",
      text: `Your UrbanTrack password reset OTP is ${otp}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`,
      html: otpEmailHtml("Reset your UrbanTrack password", otp),
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
    if (error && error.code === "auth/user-not-found") {
      return res.status(404).json({
        error: "No Firebase account was found for this email address.",
      });
    }

    if (error && error.code === "auth/invalid-password") {
      return res.status(400).json({
        error: "Firebase rejected this password. Try a stronger password.",
      });
    }

    if (
      error &&
      (error.code === "app/invalid-credential" ||
        error.code === "auth/invalid-credential")
    ) {
      return res.status(500).json({
        error:
          "Firebase Admin credentials are invalid. Check the service account JSON.",
      });
    }

    res.status(500).json({
      error:
        error && error.message
          ? `Could not reset password: ${error.message}`
          : "Could not reset password.",
    });
  }
});

app.post("/api/email/report-confirmation", async function (req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email))
      return res
        .status(400)
        .json({ error: "Valid reporter email is required." });

    const ref = req.body.ref || "UrbanTrack report";
    const title = req.body.title || "your issue";

    await sendEmail({
      to: email,
      subject: `UrbanTrack received report ${ref}`,
      text: `Hi ${req.body.name || "there"}, we received your report "${title}". Reference: ${ref}.`,
      html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
                    <h2>Report received</h2>
                    <p>Hi ${req.body.name || "there"},</p>
                    <p>We received your report: <strong>${title}</strong>.</p>
                    <p>Reference: <strong>${ref}</strong></p>
                </div>
            `,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Report confirmation email error:", error);
    res
      .status(500)
      .json({ error: "Could not send report confirmation email." });
  }
});

app.post("/api/email/status-update", async function (req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email))
      return res
        .status(400)
        .json({ error: "Valid reporter email is required." });

    const status = String(req.body.status || "updated").replace("-", " ");
    const ref = req.body.ref || "your report";
    const title = req.body.title || "your issue";

    await sendEmail({
      to: email,
      subject: `UrbanTrack report ${ref} status changed`,
      text: `Your report "${title}" is now ${status}. Reference: ${ref}.`,
      html: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
                    <h2>Report status updated</h2>
                    <p>Your report <strong>${title}</strong> is now <strong>${status}</strong>.</p>
                    <p>Reference: <strong>${ref}</strong></p>
                </div>
            `,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Status email error:", error);
    res.status(500).json({ error: "Could not send status update email." });
  }
});

app.get("/dev/send-test-email", async function (req, res) {
  try {
    const to = process.env.SMTP_USER;
    if (!to) return res.status(400).json({ error: "No SMTP_USER configured" });
    const info = await sendEmail({
      to,
      subject: "UrbanTrack test email",
      text: "This is a test email from UrbanTrack.",
      html: "<p>This is a test email from <strong>UrbanTrack</strong>.</p>",
    });
    res.json({ ok: true, info });
  } catch (err) {
    console.error("Dev test email error:", err);
    res.status(500).json({ error: String(err && err.message) || "unknown" });
  }
});

// Start server
app.listen(3000, function () {
  console.log("Server running on http://localhost:3000");
});
