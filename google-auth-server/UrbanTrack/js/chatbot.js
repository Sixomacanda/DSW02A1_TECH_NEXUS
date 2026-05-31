<<<<<<< HEAD:UrbanTrack/js/chatbot.js
// const API_KEY = "";

// async function sendMessage() {
//   const input = document.getElementById("userInput").value;

//   const response = await fetch(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: input }]
//           }
//         ]
//       })
//     }
//   );

//   const data = await response.json();

//   const reply =
//     data.candidates?.[0]?.content?.parts?.[0]?.text ||
//     "No response";

//   document.getElementById("botReply").innerText = reply;
=======
// // UrbanTrack Chat System

// const CP_SYSTEM_PROMPT = `You are the UrbanTrack assistant — a helpful, friendly AI on an urban issue-reporting platform.
// You help residents:
// 1. Report city issues (potholes, broken streetlights, illegal dumping, graffiti, broken sidewalks, water leaks, etc.)
// 2. Understand what information is needed (location, description, photo tip)
// 3. Learn how reporting and resolution works
// 4. Get estimated fix timelines: emergency 24 hr, high priority 3–5 days, medium 1–2 weeks, low 4–6 weeks
// 5. Feel heard — people report issues because they care about their community

// Keep responses concise (2–4 sentences). Warm, civic-minded tone. When someone describes an issue, confirm the type, ask for location if missing, and confirm the report will be logged.`;

// const cpHistory = [];

// // Elements
// const cpTrigger = document.getElementById("chatTrigger");
// const cpPanel   = document.getElemmentById("chatPanel");
// const cpBadge   = document.getElementById("chatBadge");

// // Toggle chat open/close
// cpTrigger.addEventListener("click", () => {
//     const isOpen = cpPanel.classList.toggle("open");
//     cpTrigger.classList.toggle("open", isOpen);

//     if (isOpen) {
//         cpBadge.style.display = "none";
//         document.getElementById("cpInput").focus();
//     }
// });

// // Show badge after 3 seconds
// setTimeout(() => {
//     if (!cpPanel.classList.contains("open")) {
//         cpBadge.style.display = "flex";
//     }
// }, 3000);

// // Auto resize input
// function cpAutoResize(el) {
//     el.style.height = "auto";
//     el.style.height = Math.min(el.scrollHeight, 80) + "px";
// }

// // Enter key send
// function cpHandleKey(e) {
//     if (e.key === "Enter" && !e.shiftKey) {
//         e.preventDefault();
//         cpSendMessage();
//     }
// }

// // Use suggestion chips
// function cpUseSuggestion(text) {
//     document.getElementById("cpInput").value = text;
//     cpSendMessage();
// }

// // Clear chat
// function cpClearChat() {
//     cpHistory.length = 0;

//     document.getElementById("cpBody").innerHTML = `
//         <div class="cp-msg-row bot">
//             <div class="cp-av bot">🏙️</div>
//             <div class="cp-bubble bot">
//                 Chat cleared! How can I help with UrbanTrack today?
//             </div>
//         </div>
//     `;

//     document.getElementById("cpChips").style.display = "flex";
// }

// // Append message
// function cpAppendMsg(role, text) {
//     const body = document.getElementById("cpBody");

//     const row = document.createElement("div");
//     row.className = `cp-msg-row ${role}`;

//     const av = document.createElement("div");
//     av.className = `cp-av ${role}`;
//     av.textContent = role === "bot" ? "🏙️" : "👤";

//     const bbl = document.createElement("div");
//     bbl.className = `cp-bubble ${role}`;
//     bbl.textContent = text;

//     row.appendChild(av);
//     row.appendChild(bbl);
//     body.appendChild(row);

//     body.scrollTop = body.scrollHeight;
// }

// // Typing indicator
// function cpShowTyping() {
//     const body = document.getElementById("cpBody");

//     const row = document.createElement("div");
//     row.className = "cp-msg-row bot";
//     row.id = "cpTypingRow";

//     const av = document.createElement("div");
//     av.className = "cp-av bot";
//     av.textContent = "🏙️";

//     const bbl = document.createElement("div");
//     bbl.className = "cp-bubble bot";
//     bbl.innerHTML = `<div class="cp-typing"><span></span><span></span><span></span></div>`;

//     row.appendChild(av);
//     row.appendChild(bbl);
//     body.appendChild(row);

//     body.scrollTop = body.scrollHeight;
// }

// // Remove typing
// function cpRemoveTyping() {
//     const r = document.getElementById("cpTypingRow");
//     if (r) r.remove();
// }

// // Loading state
// function cpSetLoading(on) {
//     const btn  = document.getElementById("cpSendBtn");
//     const icon = document.getElementById("cpSendIcon");

//     btn.disabled = on;
//     btn.classList.toggle("loading", on);

//     icon.innerHTML = on
//         ? `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40" stroke-dashoffset="15" fill="none"/>`
//         : `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`;
// }

// // MAIN SEND MESSAGE FUNCTION
// async function cpSendMessage() {
//     const input = document.getElementById("cpInput");
//     const text = input.value.trim();

//     if (!text) return;

//     document.getElementById("cpChips").style.display = "none";

//     input.value = "";
//     input.style.height = "auto";

//     cpAppendMsg("user", text);

//     cpHistory.push({
//         role: "user",
//         parts: [{ text }]
//     });

//     cpSetLoading(true);
//     cpShowTyping();

//     try {
//         const res = await fetch("/api/chat", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 message: text,
//                 history: cpHistory
//             })
//         });

//         const data = await res.json();

//         if (!res.ok) {
//             throw new Error(data.error || "API error " + res.status);
//         }

//         const reply = data.reply;

//         cpRemoveTyping();
//         cpAppendMsg("bot", reply);

//         cpHistory.push({
//             role: "model",
//             parts: [{ text: reply }]
//         });

//     } catch (err) {
//         cpRemoveTyping();
//         cpAppendMsg("bot", "Error: " + err.message);
//     } finally {
//         cpSetLoading(false);
//     }
>>>>>>> d71744ac2cc31a3e4eb8fd582d854fe3c6af24fc:google-auth-server/UrbanTrack/js/chatbot.js
// }