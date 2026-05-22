require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// FIXED STATIC FOLDER
app.use(express.static(path.join(__dirname, "UrbanTrack")));

// HOME PAGE
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "UrbanTrack/pages/login.html")
    );
});

// Chat route
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
                                { text: userMessage }
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
            error: err.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`UrbanTrack server running → http://localhost:${PORT}`);
});