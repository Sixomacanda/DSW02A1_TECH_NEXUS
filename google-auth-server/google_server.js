require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const path = require("path");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

app.set("trust proxy", 1);

app.use(express.json());;

app.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        const userDoc = await db
            .collection("users")
            .doc(email)
            .get();

        if (!userDoc.exists) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        const user = userDoc.data();

        const match = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!match) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        req.session.user = {
            uid: email,
            email: user.email,
            name: user.name
        };

        res.json({
            success: true,
            user: req.session.user
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Server error"
        });
    }
});


// IMPORTANT: strict CORS for production
app.use(cors({
    origin: [
        "http://localhost:5501",
        "https://dsw02a1-tech-nexus-2.onrender.com"
    ],
    credentials: true
}));
app.use(express.static("UrbanTrack"));



// Serve static files
app.use(
    express.static(
        path.join(__dirname, "..", "UrbanTrack")
    )
);

// MAINPAGE
app.get("/homePage", (req, res) => {
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

/*app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "UrbanTrack", "pages", "homePage.html"));
});*/




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
    passport.authenticate("google", {
        failureRedirect: FRONTEND_LOGIN_URL,
    }),

    async function (req, res) {

        try {

            const googleUser = {
                name: req.user.displayName,
                email: req.user.emails[0]?.value,
                id: req.user.id,
                picture: req.user.photos[0]?.value,
                role: "user"
            };

            // SAVE USER TO FIRESTORE
            const userRef = db
                .collection("users")
                .doc(googleUser.email);

            const existingUser =
                await userRef.get();

            if (!existingUser.exists) {

                await userRef.set({
                    name: googleUser.name,
                    email: googleUser.email,
                    googleId: googleUser.id,
                    picture: googleUser.picture,
                    createdAt: new Date()
                });
            }

            // SESSION
            req.session.user = googleUser;

            // REDIRECT
            res.redirect(FRONTEND_URL);

        } catch (err) {

            console.error(err);

            res.redirect(FRONTEND_LOGIN_URL);
        }
    }
);
// Get user session
app.get("/auth/user", (req, res) => {
  res.json(req.session.user || null);
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