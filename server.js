<<<<<<< HEAD
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Serve frontend
// app.use(express.static(path.join(__dirname)));

//chat rout
app.post("/api/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: userMessage }]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        // extract clean reply (IMPORTANT FIX)
        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn't generate a response.";

        // return clean JSON (NOT full Gemini response)
        res.json({ reply });

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: err.message });
    }
});

//starts server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`UrbanTrack server running → http://localhost:${PORT}`);
=======
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

//Serve main root files
app.use(express.static(__dirname));

//Serve UrbanTrack folder
app.use(express.static(path.join(__dirname, "UrbanTrack")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "homePage.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
>>>>>>> 5a4397e34ac5e70efa640bae2c2fe871ee2df6ba
});