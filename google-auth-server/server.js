require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Session setup (only once!)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
  }),
  cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use(express.static("public"));
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
        (accessToken, refreshToken, profile, done) => done(null, profile)
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:5501/UrbanTrack/pages/login.html";

app.get("/auth/google", (req, res, next) => {
    const originUrl = req.headers.referer || FRONTEND_LOGIN_URL;
    req.session.returnTo = originUrl;
    console.log("Google auth initiated from:", originUrl);
    next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: FRONTEND_LOGIN_URL }),
    (req, res) => {
        console.log("Google auth successful, user:", req.user ? req.user.displayName : "no user");
        console.log("Redirecting to", FRONTEND_URL);

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

app.get("/auth/user", (req, res) => res.json(req.user || null));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));