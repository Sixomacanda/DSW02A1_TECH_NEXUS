const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const app = express();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : null;

if (!admin.apps.length && serviceAccountPath) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

// Nodemailer Transporter Setup
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || "false") === "true";
const smtpAllowInsecure =
  String(process.env.SMTP_ALLOW_INSECURE || "false") === "true";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: smtpAllowInsecure ? { rejectUnauthorized: false } : undefined,
});

// In-memory store for OTPs (For production, use Redis or a Database)
const otpStore = new Map();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getValidOtpRecord(email, otp, purpose) {
  const normalizedEmail = normalizeEmail(email);
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { error: "No OTP found for this email" };
  }

  if (record.expires < Date.now()) {
    otpStore.delete(normalizedEmail);
    return { error: "OTP has expired" };
  }

  if (record.otp !== String(otp || "").trim()) {
    return { error: "Invalid OTP code" };
  }

  if (purpose && record.purpose !== purpose) {
    return { error: "Invalid OTP code" };
  }

  return { record, normalizedEmail };
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
const ROOT = path.join(__dirname, "..");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(ROOT));

app.use(passport.initialize());
app.use(passport.session());

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

if (!process.env.SESSION_SECRET) {
    console.warn(
        "Warning: SESSION_SECRET is not set. This is unsafe in production."
    );
}

if (GOOGLE_OAUTH_CONFIGURED) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL:
                    process.env.GOOGLE_CALLBACK_URL ||
                    "http://localhost:3000/auth/google/callback",
            },
            function (accessToken, refreshToken, profile, done) {
                return done(null, profile);
            }
        )
    );
} else {
    console.warn(
        "Google OAuth credentials missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
    );
}

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

// --- Password Recovery Routes ---

// 1. Send 6-digit OTP via Email
app.post("/api/email/password-otp", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store OTP with a 10-minute expiry
  otpStore.set(email, {
    otp,
    expires: Date.now() + 600000,
    purpose: "password",
  });

  const mailOptions = {
    from:
      process.env.MAIL_FROM ||
      `"UrbanTrack Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your UrbanTrack Password Reset Code",
    text: `Your password reset code is: ${otp}. This code expires in 10 minutes.`,
    html: `<h3>Password Recovery</h3><p>Your 6-digit reset code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    res
      .status(500)
      .json({ error: "Failed to send email. Check SMTP settings." });
  }
});

// 2. Verify OTP
app.post("/api/email/verify-password-otp", (req, res) => {
  const { email, otp } = req.body;
  const result = getValidOtpRecord(email, otp, "password");

  if (result.error) return res.status(400).json({ error: result.error });

  res.json({ success: true, message: "OTP verified" });
});

// 3. Reset Firebase Auth password after OTP verification
app.post("/api/email/reset-password", async (req, res) => {
  const { email, otp, password } = req.body;
  const result = getValidOtpRecord(email, otp, "password");

  if (result.error) return res.status(400).json({ error: result.error });

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = await admin.auth().getUserByEmail(result.normalizedEmail);
    await admin.auth().updateUser(user.uid, { password });
    otpStore.delete(result.normalizedEmail);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Firebase password reset error:", error);
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({ error: "No account found for this email" });
    }
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// --- Signup OTP Routes ---

app.post("/api/email/signup-otp", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    await admin.auth().getUserByEmail(email);
    return res.status(409).json({ error: "Email is already registered" });
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      console.error("Signup email check error:", error);
      return res.status(500).json({ error: "Failed to check email" });
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, {
    otp,
    expires: Date.now() + 600000,
    purpose: "signup",
  });

  const mailOptions = {
    from:
      process.env.MAIL_FROM ||
      `"UrbanTrack Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your UrbanTrack email",
    text: `Your UrbanTrack signup code is: ${otp}. This code expires in 10 minutes.`,
    html: `<h3>Verify your email</h3><p>Your 6-digit signup code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Signup OTP sent to ${email}`);
    res.json({ success: true, message: "Signup OTP sent successfully" });
  } catch (error) {
    console.error("Signup OTP email error:", error);
    res
      .status(500)
      .json({ error: "Failed to send email. Check SMTP settings." });
  }
});

app.post("/api/email/complete-signup", async (req, res) => {
  const { surname, password, otp } = req.body;
  const email = normalizeEmail(req.body.email);
  const result = getValidOtpRecord(email, otp, "signup");

  if (result.error) return res.status(400).json({ error: result.error });

  if (!surname || !String(surname).trim()) {
    return res.status(400).json({ error: "Surname is required" });
  }

  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = await admin.auth().createUser({
      email: result.normalizedEmail,
      password,
      emailVerified: true,
      displayName: String(surname).trim(),
    });

    await admin.firestore().collection("users").doc(user.uid).set({
      surname: String(surname).trim(),
      email: result.normalizedEmail,
      reportsCount: 0,
    });

    otpStore.delete(result.normalizedEmail);
    res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Signup completion error:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

// --- Issue Notification Routes ---

app.post("/api/email/report-submitted", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { name, ref, title, status } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!ref) return res.status(400).json({ error: "Reference number is required" });

  const displayName = String(name || "Community Member").trim();
  const issueTitle = String(title || "your issue report").trim();
  const currentStatus = String(status || "pending").replace("-", " ");

  const mailOptions = {
    from:
      process.env.MAIL_FROM ||
      `"UrbanTrack Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `UrbanTrack report submitted: ${ref}`,
    text:
      `Hi ${displayName},\n\n` +
      `Your issue report was submitted successfully.\n\n` +
      `Reference number: ${ref}\n` +
      `Issue: ${issueTitle}\n` +
      `Current status: ${currentStatus}\n\n` +
      `Keep this reference number for tracking your report.`,
    html:
      `<h3>Report submitted successfully</h3>` +
      `<p>Hi ${displayName}, your issue report was submitted successfully.</p>` +
      `<p><strong>Reference number:</strong> ${ref}</p>` +
      `<p><strong>Issue:</strong> ${issueTitle}</p>` +
      `<p><strong>Current status:</strong> ${currentStatus}</p>` +
      `<p>Keep this reference number for tracking your report.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Report submission email sent" });
  } catch (error) {
    console.error("Report submission email error:", error);
    res.status(500).json({ error: "Failed to send report email" });
  }
});

app.post("/api/email/report-status", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { name, ref, title, status } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!ref) return res.status(400).json({ error: "Reference number is required" });
  if (!["in-progress", "resolved"].includes(status)) {
    return res.status(400).json({ error: "Unsupported status" });
  }

  const displayName = String(name || "Community Member").trim();
  const issueTitle = String(title || "your issue report").trim();
  const statusLabel = status === "in-progress" ? "In Progress" : "Resolved";

  const mailOptions = {
    from:
      process.env.MAIL_FROM ||
      `"UrbanTrack Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `UrbanTrack report ${ref} is ${statusLabel}`,
    text:
      `Hi ${displayName},\n\n` +
      `Your issue report status has changed.\n\n` +
      `Reference number: ${ref}\n` +
      `Issue: ${issueTitle}\n` +
      `New status: ${statusLabel}\n\n` +
      `Thank you for helping improve your community.`,
    html:
      `<h3>Report status updated</h3>` +
      `<p>Hi ${displayName}, your issue report status has changed.</p>` +
      `<p><strong>Reference number:</strong> ${ref}</p>` +
      `<p><strong>Issue:</strong> ${issueTitle}</p>` +
      `<p><strong>New status:</strong> ${statusLabel}</p>` +
      `<p>Thank you for helping improve your community.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Report status email sent" });
  } catch (error) {
    console.error("Report status email error:", error);
    res.status(500).json({ error: "Failed to send status email" });
  }
});

// Start server
app.listen(3000, function () {
  console.log("Server running on http://localhost:3000");
});
