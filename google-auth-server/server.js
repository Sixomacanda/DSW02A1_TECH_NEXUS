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
        secret: process.env.SESSION_SECRET || "default-unsafe-secret-change-in-production",
        resave: false,
        saveUninitialized: false,
    })
);
const ROOT = path.join(__dirname, "..");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(ROOT));


app.use(passport.initialize());
app.use(passport.session());

const GOOGLE_OAUTH_CONFIGURED = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
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
        if (!GOOGLE_OAUTH_CONFIGURED) {
            return res
                .status(503)
                .send("Google OAuth is not configured on this server.");
        }
        console.log("Google auth initiated from:", req.headers.referer);
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
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
        if (!GOOGLE_OAUTH_CONFIGURED) {
            return res
                .status(503)
                .send("Google OAuth is not configured on this server.");
        }
        console.log("Google callback received, query:", req.query);
        next();
    },
    passport.authenticate("google", {
        failureRedirect: FRONTEND_LOGIN_URL,
    }),
    function (req, res) {
        console.log("Google auth successful, user:", req.user ? req.user.displayName : "no user");
        console.log("Google auth successful, redirecting to", FRONTEND_URL);
        
        // Store user data in session and send as query params
        if (req.user) {
            const userData = JSON.stringify({
                name: req.user.displayName,
                email: req.user.emails[0]?.value,
                id: req.user.id,
                picture: req.user.photos[0]?.value,
                role: 'user'
            });
            res.redirect(FRONTEND_URL + "?googleUser=" + encodeURIComponent(userData));
        } else {
            res.redirect(FRONTEND_URL);
        }
    }
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

// Ensure root home page is served when running backend directly
function serveHomePage(req, res) {
    const filePath = path.join(ROOT, "homePage.html");
    console.log("Serving home page for", req.path, "->", filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Failed to send homePage.html:", err);
            if (!res.headersSent) {
                res.status(err.status || 500).send(err.message);
            }
        }
    });
}
app.get("/", serveHomePage);
app.get("/homePage", serveHomePage);
app.get("/homePage.html", serveHomePage);

// Start server
app.listen(3000, function () {
  console.log("Server running on http://localhost:3000");
});
