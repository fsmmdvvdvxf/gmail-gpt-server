import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json());

// Read from environment variables (Render)
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // should be https://gmail-gpt-server.onrender.com/oauth2callback

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Missing CLIENT_ID, CLIENT_SECRET, or REDIRECT_URI env vars");
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// In memory token store (good enough for your personal use)
let tokens = null;

// Simple health check
app.get("/", (req, res) => {
  res.send("Gmail GPT backend running");
});

// Start Google OAuth sign in
app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    prompt: "consent"
  });
  res.redirect(url);
});

// OAuth callback from Google
app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).send("Missing code parameter");
    }

    const { tokens: newTokens } = await oauth2Client.getToken(code);
    tokens = newTokens;
    oauth2Client.setCredentials(tokens);

    res.send("Gmail connected. You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth error");
  }
});

// "Logout" endpoint to clear tokens
app.get("/logout", (req, res) => {
  tokens = null;
  res.send("Gmail disconnected.");
});

// Helper to make sure we are authenticated
function ensureAuthed(req, res, next) {
  if (!tokens) {
    return res
      .status(401)
      .json({ error: "Not authenticated. Visit /auth in a browser first." });
  }
  oauth2Client.setCredentials(tokens);
  next();
}

// Encode email to base64url for Gmail API
function makeRawMessage(to, subject, message) {
  const emailLines = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    `Subject: ${subject}`,
    "",
    message
  ];

  const email = emailLines.join("\r\n");
  const base64Email = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return base64Email;
}

// Main endpoint GPT will call
// Schema path in GPT should be /sendEmail (POST)
app.post("/sendEmail", ensureAuthed, async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res
        .status(400)
        .json({ error: "Missing to, subject, or message field" });
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const raw = makeRawMessage(to, subject, message);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw
      }
    });

    res.json({ success: true, id: response.data.id });
  } catch (err) {
    console.error("sendEmail error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Optional health check route for Render
app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
