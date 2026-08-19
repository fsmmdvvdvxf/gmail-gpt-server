// netlify/functions/content.js — the site's editable content store.
//
// Backs the owner admin panel (/admin) and the public site. Content lives in
// Netlify Blobs so the owner can edit the site at any time with no code deploy.
//
//   GET  /api/content            -> { data: <business.json | null>, source }
//                                   public; returns the saved content, or null
//                                   so the client falls back to the bundled
//                                   business.json (first run, before any edit).
//   POST /api/content            -> save; requires header  x-admin-key: <ADMIN_KEY>
//                                   body = the full business.json object.
//
// Auth: a single owner key in the ADMIN_KEY env var (Netlify site settings —
// never in the repo). Until it's set, saving is disabled (503) but the public
// site still works from the bundled business.json.

let getStore;
try { ({ getStore } = require("@netlify/blobs")); } catch (_) { /* not available locally */ }

const STORE = "site-content";
const KEY = "business";

exports.handler = async (event) => {
  const method = event.httpMethod;

  // ---- Read (public) ----
  if (method === "GET") {
    try {
      const store = getStore(STORE);
      const data = await store.get(KEY, { type: "json" });
      return json(200, { data: data || null, source: data ? "blob" : "default" });
    } catch (e) {
      // Blobs unavailable (e.g. local dev) — tell client to use bundled file.
      return json(200, { data: null, source: "default" });
    }
  }

  // ---- Write (owner only) ----
  if (method === "POST") {
    if (!process.env.ADMIN_KEY) {
      return json(503, { error: "Editing isn't set up yet. Ask your developer to set the ADMIN_KEY on the site." });
    }
    const supplied = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
    if (!supplied || supplied !== process.env.ADMIN_KEY) {
      return json(401, { error: "Wrong password." });
    }
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad data." }); }
    if (!body || typeof body !== "object" || !body.name) {
      return json(400, { error: "That doesn't look like valid site content." });
    }
    try {
      const store = getStore(STORE);
      // keep a timestamped backup, then save current
      const prev = await store.get(KEY, { type: "json" }).catch(() => null);
      if (prev) await store.setJSON(`${KEY}.backup.${Date.now()}`, prev).catch(() => {});
      await store.setJSON(KEY, body);
      return json(200, { ok: true, saved: true });
    } catch (e) {
      return json(500, { error: "Couldn't save right now. Please try again." });
    }
  }

  return json(405, { error: "Method not allowed" });
};

function json(status, obj) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(obj),
  };
}
