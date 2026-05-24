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
});