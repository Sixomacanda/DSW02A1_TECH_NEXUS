require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = require("node-fetch"); // 👈 IMPORTANT

const app = express();

app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// Chatbot route
app.post("/api/chat", async (req, res) => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(req.body)
            }
        );

        const data = await response.json();
        res.json(data);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`UrbanTrack server running → http://localhost:${PORT}`);
});