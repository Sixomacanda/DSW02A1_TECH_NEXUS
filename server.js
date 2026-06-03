console.log("🔥 SERVER LOADED - complete-signup route should exist");


require("dotenv").config();

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "google-auth-server", ".env"),
});

const express = require("express");
const fs = require("fs");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const app = express();
const geminiApiKey = process.env.GEMINI_API_KEY;
const googleAuthDir = path.join(__dirname, "google-auth-server");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? resolveProjectPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, googleAuthDir)
  : null;

function resolveProjectPath(filePath, defaultBaseDir) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  const defaultLocation = path.resolve(defaultBaseDir, filePath);
  if (fs.existsSync(defaultLocation)) {
    return defaultLocation;
  }

  return path.resolve(__dirname, filePath);
}

if (!admin.apps.length && serviceAccountPath) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

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

const otpStore = new Map();

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
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

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "default-unsafe-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(express.static(path.join(googleAuthDir, "public")));
app.use(express.static(path.join(__dirname)));

app.use(passport.initialize());
app.use(passport.session());

const GOOGLE_OAUTH_CONFIGURED = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

if (!process.env.SESSION_SECRET) {
  console.warn(
    "Warning: SESSION_SECRET is not set. Using an unsafe development fallback.",
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
      },
    ),
  );
} else {
  console.warn(
    "Google OAuth credentials missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
  );
}

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

function ensureGoogleOAuthConfigured(req, res, next) {
  if (!GOOGLE_OAUTH_CONFIGURED) {
    return res
      .status(503)
      .send("Google OAuth is not configured on this server.");
  }

  next();
}

function serveHomePage(req, res) {
  res.sendFile(path.join(__dirname, "homePage.html"));
}

app.get("/", serveHomePage);
app.get("/homePage", serveHomePage);
app.get("/homePage.html", serveHomePage);

app.get(
  "/auth/google",
  ensureGoogleOAuthConfigured,
  function (req, res, next) {
    console.log("Google auth initiated from:", req.headers.referer);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL =
  process.env.FRONTEND_LOGIN_URL ||
  "http://localhost:5501/UrbanTrack/pages/login.html";

app.get(
  "/auth/google/callback",
  ensureGoogleOAuthConfigured,
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

app.get("/auth/test", function (req, res) {
  console.log("Test auth endpoint called, redirecting to", FRONTEND_URL);
  res.redirect(FRONTEND_URL);
});

app.get("/auth/user", function (req, res) {
  res.json(req.user || null);
});

app.post("/api/email/password-otp", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
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

app.post("/api/email/verify-password-otp", (req, res) => {
  const { email, otp } = req.body;
  const result = getValidOtpRecord(email, otp, "password");

  if (result.error) return res.status(400).json({ error: result.error });

  res.json({ success: true, message: "OTP verified" });
});

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

app.post("/api/email/complete-signup", async (req, res) => {
  const { surname, password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email) return res.status(400).json({ error: "Email is required" });

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
      email,
      password,
      emailVerified: true,
      displayName: String(surname).trim(),
    });

    try {
      await admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .set({
          surname: String(surname).trim(),
          email,
          role: "user",
          reportsCount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (profileError) {
      console.warn(
        "Signup profile write failed; Firebase Auth account was created:",
        profileError,
      );
    }

    res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Signup completion error:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: "Failed to create account" });
  }
});

app.post("/api/email/report-submitted", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { name, ref, title, status } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!ref)
    return res.status(400).json({ error: "Reference number is required" });

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
  if (!ref)
    return res.status(400).json({ error: "Reference number is required" });
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

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const history = Array.isArray(req.body.history) ? req.body.history : [];

    if (!userMessage)
      return res.status(400).json({ error: "Message is required" });
    if (!geminiApiKey || geminiApiKey === "replace_with_your_gemini_api_key") {
      return res
        .status(500)
        .json({ error: "Missing GEMINI_API_KEY in google-auth-server/.env." });
    }

    const systemPrompt = `You are UrbanBot, an expert assistant for UrbanTrack - a community issue reporting platform. ONLY answer questions that are directly about UrbanTrack, its features, reporting flow, upvoting, tracking, admin actions, troubleshooting, APIs, and usage. If the user asks anything not related to UrbanTrack, reply exactly: "Sorry, I can only answer questions about UrbanTrack." Do not provide additional information for unrelated queries. When answering, be thorough and accurate, use platform knowledge when relevant, provide numbered actionable steps for how-tos, avoid hallucinations, and ask for clarification when necessary. Keep output professional and focused on UrbanTrack.`;

    let KB = [];
    try {
      const kbRaw = fs.readFileSync(
        path.join(__dirname, "urbantrack_kb.json"),
        "utf8",
      );
      KB = JSON.parse(kbRaw);
    } catch (e) {
      console.warn("Could not load urbantrack_kb.json:", e.message);
    }

    const fallback = "Sorry, I can only answer questions about UrbanTrack.";

    let systemText =
      systemPrompt +
      "\n\nAlways answer questions about UrbanTrack and its platform features thoroughly. " +
      'If the user asks anything unrelated to UrbanTrack, reply exactly: "Sorry, I can only answer questions about UrbanTrack."';

    if (KB.length) {
      const snippet = KB.slice(0, 6).join("\n");
      systemText += "\n\nRelevant UrbanTrack facts:\n" + snippet;
    }

    const contents = [];
    for (const item of history.slice(-24)) {
      if (!item || !item.role || !item.content) continue;
      const role = item.role === "assistant" ? "model" : "user";
      contents.push({ role, parts: [{ text: String(item.content) }] });
    }

    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        candidateCount: 1,
        maxOutputTokens: 800,
      },
    };

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(502).json({
        error: data?.error?.message || "Gemini API request failed",
      });
    }

    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || fallback;
    if (!reply || !String(reply).trim()) {
      reply = fallback;
    }

    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
