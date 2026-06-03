require("dotenv").config();

const path = require("path");
const express = require("express");
const fs = require("fs");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const fetch = require("node-fetch"); // ✅ added

const app = express();
const geminiApiKey = process.env.GEMINI_API_KEY;

function resolveProjectPath(filePath) {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(__dirname, filePath);
}

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? resolveProjectPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : null;

// ✅ FIXED symbols here
if (!admin.apps.length && serviceAccountPath) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

// ✅ Mail setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const otpStore = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getValidOtpRecord(email, otp, purpose) {
  const normalizedEmail = normalizeEmail(email);
  const record = otpStore.get(normalizedEmail);

  if (!record) return { error: "No OTP found" };

  if (record.expires < Date.now()) {
    otpStore.delete(normalizedEmail);
    return { error: "OTP expired" };
  }

  if (record.otp !== String(otp).trim()) {
    return { error: "Invalid OTP" };
  }

  if (purpose && record.purpose !== purpose) {
    return { error: "Invalid OTP" };
  }

  return { record, normalizedEmail };
}

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "unsafe-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ✅ Passport
app.use(passport.initialize());
app.use(passport.session());

const GOOGLE_OAUTH_CONFIGURED =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (GOOGLE_OAUTH_CONFIGURED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}

// Routes
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

//Test route (important)
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

//Chat API (Gemini)
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message required" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: "Gemini API failed" });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// IMPORTANT: Railway port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});