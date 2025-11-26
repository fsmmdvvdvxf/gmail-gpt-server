import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json());

// ENV VARS FROM RENDER
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // https://gmail-gpt-server.onrender.com/oauth2callback

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Missing CLIENT_ID, CLIENT_SECRET, or REDIRECT_URI env vars");
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// simple in-memory token store (OK for your personal use)
let tokens = null;

// Health + root
app.get("/", (req, res) => {
  res.send("Gmail GPT backend running");
});

app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

// Start OAuth flow
app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly"
    ],
    prompt: "consent"
  });
  res.redirect(url);
});

// OAuth callback
app.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing code parameter");

    const { tokens: newTokens } = await oauth2Client.getToken(code);
    tokens = newTokens;
    oauth2Client.setCredentials(tokens);

    res.send("Gmail connected. You can close this tab.");
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("OAuth error");
  }
});

// "Logout" – clears token in memory
app.get("/logout", (req, res) => {
  tokens = null;
  res.send("Gmail disconnected.");
});

// Middleware to ensure we’re authed
function ensureAuthed(req, res, next) {
  if (!tokens) {
    return res.status(401).json({
      error:
        "Not authenticated. Open /auth in a browser and connect Gmail first."
    });
  }
  oauth2Client.setCredentials(tokens);
  next();
}

// Helper to encode email
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

// SEND EMAIL – GPT calls this
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
      requestBody: { raw }
    });

    res.json({ success: true, id: response.data.id });
  } catch (err) {
    console.error("sendEmail error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// LIST UNREAD EMAILS
app.get("/listUnread", ensureAuthed, async (req, res) => {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const { data } = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 10
    });

    const messages = data.messages || [];
    const results = [];

    for (const m of messages) {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"]
      });

      const headers = msg.data.payload.headers || [];
      const getHeader = name =>
        (headers.find(h => h.name === name) || {}).value || "";

      results.push({
        id: m.id,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: msg.data.snippet || ""
      });
    }

    res.json({ messages: results });
  } catch (err) {
    console.error("listUnread error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to list unread emails" });
  }
});

// GET FULL EMAIL BODY BY ID
app.get("/getEmail", ensureAuthed, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: "Missing id query parameter" });
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const { data } = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full"
    });

    let body = "";

    // Try to find a plain text part
    function findTextPart(payload) {
      if (!payload) return null;
      if (payload.mimeType === "text/plain") return payload;
      if (!payload.parts) return null;
      for (const p of payload.parts) {
        const found = findTextPart(p);
        if (found) return found;
      }
      return null;
    }

    const textPart = findTextPart(data.payload) || data.payload;

    if (textPart.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf8");
    }

    res.json({
      id: data.id,
      threadId: data.threadId,
      snippet: data.snippet,
      body
    });
  } catch (err) {
    console.error("getEmail error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch email" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
