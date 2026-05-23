require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

/*
SERVE ALL FILES INSIDE UrbanTrack
*/
app.use(express.static(path.join(__dirname, "UrbanTrack")));

/*
LOGIN PAGE
*/
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "UrbanTrack/pages/login.html")
    );
});

/*
HOMEPAGE ROUTE
FIXES Cannot GET /homePage.html
*/
app.get("/homePage.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "UrbanTrack/pages/homePage.html")
    );
});

/*
MAINPAGE ROUTE
(for Google login redirect)
*/
app.get("/MainPage.html", (req, res) => {
    res.sendFile(
        path.join(__dirname, "UrbanTrack/pages/MainPage.html")
    );
});

/*
CHAT ROUTE
*/
app.post("/api/chat", async (req, res) => {

    try {

        const userMessage = req.body.message;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: userMessage
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response.";

        res.json({ reply });

    } catch (err) {

        console.error("Server error:", err);

        res.status(500).json({
            error: "Internal Server Error"
        });
    }
});

/*
404 HANDLER
*/
app.use((req, res) => {
    res.status(404).send("Page not found");
});

/*
START SERVER
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`UrbanTrack server running on port ${PORT}`);
});