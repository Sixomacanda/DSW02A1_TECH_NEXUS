const path = require("path");
require("dotenv").config();
require("dotenv").config({
  path: path.join(__dirname, "..", "UrbanTrack", "google-auth-server", ".env"),
});
const nodemailer = require("nodemailer");

console.log("Loaded SMTP config:", {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER ? "[REDACTED]" : undefined,
  MAIL_FROM: process.env.MAIL_FROM,
});

function getTransporter() {
  if (!nodemailer) return null;
  if (!process.env.SMTP_HOST)
    return nodemailer.createTransport({ jsonTransport: true });
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    tls:
      process.env.SMTP_ALLOW_INSECURE === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

const transporter = getTransporter();
if (!transporter) {
  console.error("No transporter created (nodemailer missing)");
  process.exit(2);
}

transporter.verify(function (err, success) {
  if (err) {
    console.error("transporter.verify error:", err);
    process.exit(1);
  } else {
    console.log("transporter.verify success");
    process.exit(0);
  }
});
