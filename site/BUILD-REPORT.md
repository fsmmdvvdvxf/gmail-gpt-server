# Build Report — Nicole Fields Photography

Built with the **site-builder** method: `business.json` is the content spine,
pages bind it at runtime via `data-field`, sections gate on data presence, and
serverless functions handle the contact form and the editable content store.
Design layer is a custom **liquid-glass** system (frosted panels over a warm
aurora).

## Owner admin — edit the site anytime

`/admin` is a password-gated editor. The owner can change business info, story,
location, contact/social links, services (add/edit/remove), and section toggles,
then **Save** — updates go live with no code change or rebuild.

- **How it persists:** the admin `POST`s to `/api/content` → a Netlify Function
  (`netlify/functions/content.js`) that writes to **Netlify Blobs**. The public
  site reads `/api/content` first and falls back to the bundled `business.json`.
- **Password:** set `ADMIN_KEY` in Netlify env (site settings). Until then, the
  editor still works and keeps changes **locally** (localStorage) with JSON
  **export/import** backup — it just can't publish globally.
- **Dependency:** `netlify/functions/package.json` declares `@netlify/blobs`
  (Netlify installs it automatically).

## Pages

Home · Portfolio · About · **Services** (what she photographs) · **Pricing**
(now a separate page — how pricing & booking work) · Contact · 404 · `/admin`.

## Verified facts used

Location confirmed by the owner: **Effingham, Illinois**, available to travel for
sessions **across the state**. Owner also noted a possible name-collision with a
different "Nicole Fields" photographer in the Chicago area — so Chicago-sourced
details were treated as suspect (see below).

Kept (consistent with her About page): laid-back / never-rushed approach; family
+ two boys; professional Nikon gear; fully insured & registered in Illinois;
in-house custom framing; sessions ≈ 1 hour; digital-contract booking; full
service list (family, children, maternity & newborn, seniors, engagements,
weddings, headshots, sports & fitness).

## PENDING — could not verify in this environment

The network proxy here blocks her website, the Wayback Machine, and photo hosts,
so these could not be confirmed and are **not fabricated**:

1. **Real photographs** — the top priority swap. All imagery is generated
   on-canvas (warm placeholder art). Her galleries couldn't be retrieved here.
2. **Email / phone / social links** — set to `PENDING` and hidden. The
   `nicolefieldsphotos@gmail.com` + `@nicolefieldsphotos` found earlier were tied
   to the Chicago listing and may be a **different** Nicole Fields, so the site
   asserts none of them. The owner can add the real ones in `/admin`.
3. **Prices** — every service shows "Inquire"; no prices invented.
4. **Hours, Google rating & reviews** — hidden/off (nothing approved). No
   testimonials fabricated.
5. **Brand (logo, colors, fonts, favicon)** — liquid-glass palette (coral +
   slate) is provisional; favicon is a generated "NF" monogram.

## Deploy

`netlify.toml` publishes this folder and wires `/api/contact` and `/api/content`
to their functions. Env vars (Netlify site settings — never in the repo):

| Var | For |
|-----|-----|
| `ADMIN_KEY` | the owner's admin password (enables Save in `/admin`) |
| `SENDGRID_API_KEY`, `DELIVER_TO`, `SEND_FROM` | contact-form email delivery |

Run locally over http (the admin + content API need a server; static fallback works):

```bash
cd site
python3 -m http.server 8000     # or: npx serve .
```
