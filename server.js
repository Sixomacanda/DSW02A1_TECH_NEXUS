const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "UrbanTrack")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "homePage.html"));
});

// SIGNUP API ROUTE
app.post("/signup", (req, res) => {
  const { email, password } = req.body;

  console.log("Received signup:", email);

  // Example validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  // Success response
  res.json({
    success: true,
    message: "Signup successful"
  });
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});