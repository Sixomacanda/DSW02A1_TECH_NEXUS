require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "homePage.html"));
});

// Chat API — accepts `{ message, history }` and forwards a system-guided prompt to Gemini
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const history = Array.isArray(req.body.history) ? req.body.history : [];

        if (!userMessage) return res.status(400).json({ error: 'Message is required' });

        const systemPrompt = `You are UrbanBot, an expert assistant for UrbanTrack — a community issue reporting platform. Answer user questions thoroughly and accurately, using platform knowledge when relevant (reporting flow, upvoting, tracking, admin actions, and troubleshooting). If the user asks for steps, provide numbered actionable steps. Be concise but cover advanced topics when asked (eg. data flow, API usage, authentication). Do not hallucinate facts; ask for clarification or admit when you don't know. Keep output helpful and professional.`;

        const contents = [];
        // system instruction
        contents.push({ role: 'system', parts: [{ text: systemPrompt }] });

        // include recent conversation history (if any)
        for (const item of history.slice(-24)) {
            if (!item || !item.role || !item.content) continue;
            const role = item.role === 'assistant' ? 'assistant' : 'user';
            contents.push({ role, parts: [{ text: String(item.content) }] });
        }

        // finally add latest user message
        contents.push({ role: 'user', parts: [{ text: userMessage }] });

        const payload = {
            temperature: 0.2,
            candidateCount: 1,
            maxOutputTokens: 800,
            contents
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        res.json({ reply });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});