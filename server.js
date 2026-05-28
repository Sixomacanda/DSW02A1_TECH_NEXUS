require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// Static frontend mounts (so URLs like /homePage.html work)
app.use(express.static(__dirname)); // serves homePage.html from project root
app.use(express.static(path.join(__dirname, "UrbanTrack/pages"))); // serves /login.html etc.
app.use(express.static(path.join(__dirname, "UrbanTrack"))); // serves /js, /Styles, /Pictues, etc.


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
});
