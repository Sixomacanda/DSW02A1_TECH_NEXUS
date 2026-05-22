require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");

const app = express();

// IMPORTANT: strict CORS for production
app.use(cors({
    origin: [
        "http://localhost:5501",
        "https://dsw02a1-tech-nexus-2.onrender.com"
    ],
    credentials: true
}));

app.use(express.json());

const MongoStore = require("connect-mongo").MongoStore;

// Debug route
app.get("/debug", (req, res) => {
    res.json({
        callback: "https://dsw02a1-tech-nexus-2.onrender.com/auth/google/callback",
        client: process.env.GOOGLE_CLIENT_ID
    });
});

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL,
        collectionName: "sessions"
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: true,
        sameSite: "none"
    }
}));

console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);

app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.send("Server is working");
});

// Google Strategy (FIXED - no env risk)
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://dsw02a1-tech-nexus-2.onrender.com/auth/google/callback"
        },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "https://dsw02a1-tech-nexus-2.onrender.com/UrbanTrack/pages/MainPage.html";

const FRONTEND_LOGIN_URL =
    process.env.FRONTEND_LOGIN_URL ||
    "https://dsw02a1-tech-nexus-2.onrender.com/UrbanTrack/pages/login.html";

// Google login
app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Google callback
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: FRONTEND_LOGIN_URL }),
    (req, res) => {

        if (!req.user) {
            return res.redirect(FRONTEND_LOGIN_URL);
        }

        const userData = JSON.stringify({
            name: req.user.displayName,
            email: req.user.emails?.[0]?.value,
            id: req.user.id,
            picture: req.user.photos?.[0]?.value,
            role: "user"
        });

        res.redirect(
            `${FRONTEND_URL}?googleUser=${encodeURIComponent(userData)}`
        );
    }
);

// Get user session
app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});