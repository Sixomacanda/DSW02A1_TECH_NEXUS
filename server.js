require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require('fs');

const app = express();
const geminiApiKey = process.env.GEMINI_API_KEY;

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
        if (!geminiApiKey || geminiApiKey === 'replace_with_your_gemini_api_key') {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in the root .env file.' });
        }

        const systemPrompt = `You are UrbanBot, an expert assistant for UrbanTrack — a community issue reporting platform. ONLY answer questions that are directly about UrbanTrack, its features, reporting flow, upvoting, tracking, admin actions, troubleshooting, APIs, and usage. If the user asks anything not related to UrbanTrack, reply exactly: "Sorry, I can only answer questions about UrbanTrack." Do not provide additional information for unrelated queries. When answering, be thorough and accurate, use platform knowledge when relevant, provide numbered actionable steps for how-tos, avoid hallucinations, and ask for clarification when necessary. Keep output professional and focused on UrbanTrack.`;

        // Load the local UrbanTrack KB (small grounding facts)
        let KB = [];
        try {
            const kbRaw = fs.readFileSync(path.join(__dirname, 'urbantrack_kb.json'), 'utf8');
            KB = JSON.parse(kbRaw);
        } catch (e) {
            console.warn('Could not load urbantrack_kb.json:', e.message);
        }

        // Simple relatedness check to avoid calling the API for unrelated queries
        const keywords = [
            'urbantrack','report','reporting','upvote','tracking','admin','dashboard','issue','location','map','follow','vote','authenticate','signup','signin','user settings','troubleshoot','api','endpoint','status','resolve'
        ];
        const isRelated = (text) => {
            if (!text) return false;
            const t = String(text).toLowerCase();
            return keywords.some(k => t.includes(k));
        };

        const fallback = 'Sorry, I can only answer questions about UrbanTrack.';

        // If the user's message isn't related and history has no related items, return fallback immediately
        const historyRelated = history.some(h => isRelated(h.content));
        if (!isRelated(userMessage) && !historyRelated) {
            return res.json({ reply: fallback });
        }

        const contents = [];
        // system instruction
        contents.push({ role: 'system', parts: [{ text: systemPrompt }] });

        // include small KB grounding to help the model answer accurately
        if (KB.length) {
            const snippet = KB.slice(0, 6).join('\n');
            contents.push({ role: 'system', parts: [{ text: 'Relevant UrbanTrack facts:\n' + snippet }] });
        }

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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

        // Post-check: ensure reply mentions UrbanTrack concepts; otherwise, enforce fallback
        const replyLower = String(reply).toLowerCase();
        const mentionsKeyword = keywords.some(k => replyLower.includes(k));
        if (!mentionsKeyword) {
            reply = fallback;
        }

        res.json({ reply });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
