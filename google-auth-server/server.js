require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");

const app = express();

// CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:5501"],
  credentials: true
}));

// Session setup - only once
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

app.use(express.static("public"));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        function (accessToken, refreshToken, profile, done) {
            return done(null, profile);
        }
    )
);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

// Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:5501/UrbanTrack/pages/login.html";

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: FRONTEND_LOGIN_URL }),
    function (req, res) {
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

app.get("/auth/user", function (req, res) {
    res.json(req.user || null);
});

// Start server - only once, using PORT from Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server running on port", PORT);
});