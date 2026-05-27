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
// }