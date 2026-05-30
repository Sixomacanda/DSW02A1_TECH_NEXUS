require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const path = require("path");
const MongoStore = require("connect-mongo");
const fs = require("fs");

const app = express();

/* =======================
   PATHS (FIXED)
======================= */

// backend folder (google-auth-server)
const ROOT = __dirname;

// frontend folder (outside backend)
const FRONTEND = path.join(__dirname, "../UrbanTrack");

// pages folder inside frontend
const PAGES = path.join(FRONTEND, "pages");

console.log("Backend folder:", fs.readdirSync(__dirname));
console.log("Frontend folder exists:", fs.existsSync(FRONTEND));

/* =======================
   STATIC FILES
======================= */
app.use(express.static(FRONTEND));

/* =======================
   CORS
======================= */
app.use(cors({
    origin: ["https://dsw02a1-tech-nexus-2.onrender.com"],
    credentials: true
}));

/* =======================
   SESSION
======================= */
app.set("trust proxy", 1);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions"
    }),
    cookie: {
        secure: true,
        sameSite: "none"
    }
}));

/* =======================
   PASSPORT
======================= */
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://dsw02a1-tech-nexus-2.onrender.com/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* =======================
   ROUTES
======================= */

// home page (if inside frontend root)
app.get("/homePage", (req, res) => {
    res.sendFile(path.join(FRONTEND, "homePage.html"));
});

// pages inside /pages folder
app.get("/mainPage", (req, res) => {
    res.sendFile(path.join(PAGES, "MainPage.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(PAGES, "login.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(PAGES, "UserDashboard.html"));
});

app.get("/settings", (req, res) => {
    res.sendFile(path.join(PAGES, "UserSettings.html"));
});

app.get("/signUpPage", (req, res) => {
    res.sendFile(path.join(PAGES, "signUpPage.html"));
});

/* =======================
   GOOGLE AUTH
======================= */
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/mainPage");
    }
);

/* =======================
   USER SESSION API
======================= */
app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});

/* =======================
   LOGOUT
======================= */
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});