import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

let tokens = null;

app.get("/", (req, res) => res.send("Gmail GPT backend running"));

app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    prompt: "consent"
  });
  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
  const { tokens: newTokens } = await oauth2Client.getToken(req.query.code);
  tokens = newTokens;
  oauth2Client.setCredentials(tokens);
  res.send("Gmail connected. You can close this tab.");
});

app.post("/sendEmail", async (req, res) => {
  if (!tokens) return res.status(401).json({ error: "Not authenticated. Visit /auth first." });

  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const { to, subject, body } = req.body;

  const email =
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
    body;

  const encoded = Buffer.from(email).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded }
  });

  res.json({ success: true });
});

app.listen(3000, () => console.log("Server started on 3000"));
