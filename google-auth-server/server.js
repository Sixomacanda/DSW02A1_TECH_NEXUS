require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// Session setup
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(express.static("public"));


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


// Start Google login
app.get(
    "/auth/google",
    function (req, res, next) {
        console.log("Google auth initiated from:", req.headers.referer);
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after Google login
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:5501/UrbanTrack/pages/login.html";

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

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});