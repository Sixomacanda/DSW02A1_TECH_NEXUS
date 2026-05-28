require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const path = require("path");
const MongoStore = require("connect-mongo");

const app = express();

// IMPORTANT: strict CORS for production
app.use(cors({
    origin: [
        "http://localhost:5501",
        "https://dsw02a1-tech-nexus-2.onrender.com"
    ],
    credentials: true
}));
app.use(express.static("UrbanTrack"));
app.use(express.json());


// Serve static files
app.use(
    express.static(
        path.join(__dirname, "..", "UrbanTrack")
    )
);

// HOMEPAGE
app.get("/homePage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UrbanTrack", "pages", "MainPage.html"));
});


// LOGIN
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UrbanTrack", "pages", "login.html"));
});


app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UrbanTrack", "pages", "UserDashboard.html"));
});

app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UrbanTrack", "pages", "UserSettings.html"));
});



// USER SETTINGS ROUTE
app.get("/settings", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "UrbanTrack", "pages", "UserSettings.html")
  );
});

app.set("trust proxy", 1);

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
        secure: false,
        sameSite: "lax"
    }
}));

console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);

app.use(passport.initialize());
app.use(passport.session());


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

// Google login
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:5501/UrbanTrack/pages/login.html";

// START GOOGLE LOGIN
app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// GOOGLE CALLBACK
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
        console.log("Google auth successful");

        if (req.user) {
            const userData = JSON.stringify({
                name: req.user.displayName,
                email: req.user.emails[0]?.value,
                id: req.user.id,
                picture: req.user.photos[0]?.value,
                role: "user"
            });

            // Upsert user into Firestore-like JS DB in backend is not possible here.
            // Instead, we store minimal user data in a localStorage-ready query param
            // and let the frontend write to Firestore.
            res.redirect(
                FRONTEND_URL +
                "?googleUser=" +
                encodeURIComponent(userData)
            );
        } else {
            res.redirect(FRONTEND_URL);
        }
    }
);
// Get user session
app.get("/auth/user", (req, res) => {
    res.json(req.user || null);
});

// LOGOUT ROUTE
app.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.redirect("/login"); // always go to login page
    });
  } else {
    res.redirect("/login");
  }
});


const PORT = process.env.PORT || 3000;

console.log("CURRENT DIR:", __dirname);

console.log(
    "MAIN PAGE PATH:",
    path.resolve("../UrbanTrack/pages/MainPage.html")
);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});