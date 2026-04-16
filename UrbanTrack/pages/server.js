const express = require("express");
const mysql = require("mysql2");

const app = express();

app.listen(3000, () => {
  console.log("Server running");
});