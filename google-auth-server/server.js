const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

// Session setup
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
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5501/UrbanTrack/pages/MainPage.html";
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || "http://localhost:5501/UrbanTrack/pages/login.html";

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