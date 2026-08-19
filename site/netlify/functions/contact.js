// netlify/functions/contact.js — Model B contact handler.
//
// One-time template; only SEND_FROM domain and DELIVER_TO vary per client.
// Secrets come from Netlify env vars, never the repo or client-side:
//   SENDGRID_API_KEY   per-site key under the shared agency SendGrid account
//   DELIVER_TO         owner-confirmed inbox
//   SEND_FROM          forms@<clientdomain> (domain must be SendGrid-authenticated)
//   RECAPTCHA_SECRET   reCAPTCHA v3 restricted key (optional; skipped if unset)
//
// Inert-but-graceful: if the key/DNS aren't set up yet, it returns a friendly
// 503 instead of erroring ugly, so a pre-launch form doesn't look broken.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }

  // Honeypot: bots fill hidden fields. Silently accept, don't send.
  if (body._gotcha) return json(200, { ok: true });

  const { first_name, last_name, email, phone, message } = body;
  if (!email || !message) return json(400, { error: "Email and message are required." });

  // Optional reCAPTCHA v3 verification (only if configured).
  if (process.env.RECAPTCHA_SECRET) {
    const ok = await verifyRecaptcha(body.recaptcha_token, process.env.RECAPTCHA_SECRET);
    if (!ok) return json(400, { error: "Failed spam check. Please try again." });
  }

  const KEY = process.env.SENDGRID_API_KEY;
  if (!KEY || !process.env.DELIVER_TO || !process.env.SEND_FROM) {
    // Not provisioned yet — fail politely.
    return json(503, { error: "The contact form isn't live yet. Please call or email us in the meantime." });
  }

  const payload = {
    personalizations: [{ to: [{ email: process.env.DELIVER_TO }] }],
    from: { email: process.env.SEND_FROM },
    reply_to: { email },
    subject: `New website inquiry from ${first_name || ""} ${last_name || ""}`.trim(),
    content: [{ type: "text/plain", value:
      `Name: ${first_name || ""} ${last_name || ""}\nEmail: ${email}\nPhone: ${phone || ""}\n\n${message}` }]
  };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.status >= 400) return json(502, { error: "Couldn't send right now. Please try again." });
    return json(200, { ok: true });
  } catch {
    return json(502, { error: "Couldn't send right now. Please try again." });
  }
};

async function verifyRecaptcha(token, secret) {
  if (!token) return false;
  try {
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
    });
    const d = await r.json();
    return d.success && (d.score === undefined || d.score >= 0.5);
  } catch { return false; }
}

function json(status, obj) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}
