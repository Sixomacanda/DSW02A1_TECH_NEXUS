require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const path = require("path");
const MongoStore = require("connect-mongo");

const app = express();

//paths
const PAGES = path.join(__dirname, "UrbanTrack", "pages");
const HOME_PAGE = path.join(__dirname);


// cors
app.use(cors({
    origin: [
        "https://dsw02a1-tech-nexus-2.onrender.com"
    ],
    credentials: true
}));;

// static files
app.use(express.static(path.join(__dirname, "UrbanTrack")));

// session setup
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
        secure: true,   // on render
        sameSite: "none"
    }
}));

// passport init
app.use(passport.initialize());
app.use(passport.session());

// google strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://dsw02a1-tech-nexus-2.onrender.com/auth/google/callback"
        },
        (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }
    )
);

// serialize user
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// pages
app.get("/homePage", (req, res) => {
    res.sendFile(path.join(PAGES, "homePage.html"));
});

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


// google login

const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "https://dsw02a1-tech-nexus-2.onrender.com/MainPage";

const FRONTEND_LOGIN_URL =
    process.env.FRONTEND_LOGIN_URL ||
    "https://dsw02a1-tech-nexus-2.onrender.com/login";

// google callback
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/MainPage");
    }
);


// get session user
app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});

// logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});