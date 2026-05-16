require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// Serve frontend pages and assets from the project root
const FRONTEND_ROOT = path.join(__dirname, "..", "..");
app.use("/UrbanTrack", express.static(path.join(FRONTEND_ROOT, "UrbanTrack")));
app.use(express.static(path.join(FRONTEND_ROOT, "UrbanTrack", "Styles")));
app.get(["/", "/homePage.html"], function (req, res) {
    res.sendFile(path.join(FRONTEND_ROOT, "homePage.html"));
});
app.use(express.static(path.join(__dirname, "public")));

// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
        },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    )
);

// Session handling
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});


const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:3000/UrbanTrack/pages/login.html";

// Start Google login
app.get(
    "/auth/google",
    function (req, res, next) {
        const originUrl = req.headers.referer || FRONTEND_LOGIN_URL;
        req.session.returnTo = originUrl;
        console.log("Google auth initiated from:", originUrl);
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after Google login
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
        const redirectUrl = req.session.returnTo || FRONTEND_URL;
        delete req.session.returnTo;

        console.log("Google auth successful, user:", req.user ? req.user.displayName : "no user");
        console.log("Google auth successful, redirecting to", redirectUrl);

        if (req.user) {
            const userData = JSON.stringify({
                name: req.user.displayName,
                email: req.user.emails[0]?.value,
                id: req.user.id,
                picture: req.user.photos[0]?.value,
                role: 'user'
            });
            res.redirect(redirectUrl + "?googleUser=" + encodeURIComponent(userData));
        } else {
            res.redirect(redirectUrl);
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

app.listen(PORT, function () {
    console.log(`Server running on http://localhost:${PORT}`);
});