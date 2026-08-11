# Build Report — Nicole Fields Photography

Built with the **site-builder** method: `business.json` is the content spine,
pages bind it at runtime via `data-field`, sections gate on data presence, and
the contact form is a Netlify function (Model B). Design layer is a custom
**liquid-glass** system (frosted panels over a warm aurora).

## What's real (verified via public search)

Direct crawling of `nicolefieldsphotography.net` was blocked by this
environment's network proxy, so business facts were gathered from public search
results and recorded in `../devops/research/notes.md`. Confirmed and used:

- Business & owner: **Nicole "Nikki" Fields** — Nicole Fields Photography (& Framing)
- Location: **West Chicago, IL**, serving **Chicagoland**
- Email: **nicolefieldsphotos@gmail.com**; social **@nicolefieldsphotos**
- Focus: lifestyle, family, couples, newborn
- Services: Family, Children, Maternity & Newborn, Seniors, Engagements,
  Weddings, Headshots, Sports & Fitness, plus **custom framing**
- Credentials: professional **Nikon** gear, **fully insured**, **registered in Illinois**
- Approach: laid-back, fun, unhurried, moment-by-moment; sessions ≈ 1 hour
- Booking: digital contract + payment request

## PENDING — limited the build (nothing fabricated)

These are hidden or shown as "Inquire," and are listed for the owner in
`../devops/questions-for-owner.md`:

1. **Prices** — every service shows "Inquire"; no prices were invented.
2. **Phone** — the phone row auto-hides until a number is added.
3. **Street address / hours** — service-area only; hours block hidden.
4. **Google rating & reviews** — reviews section is OFF (two-gate: none approved).
   No testimonials fabricated.
5. **Brand (logo, colors, fonts, favicon)** — the liquid-glass palette
   (coral + slate) is a provisional proposal; favicon is a generated "NF" monogram.
6. **Real photographs** — the single most important swap. All imagery is
   **generated on-canvas** (warm placeholder art), because her real galleries
   couldn't be retrieved. Replace before launch.

## How content is edited

No rebuild needed for content: edit `business.json` and save. Fields
(`name`, `tagline`, `description`, `contact.*`, `services[]`, `location.*`) bind
at runtime. Turning on reviews/hours later is a toggle in `google.display`.

## Deploy

`netlify.toml` publishes this folder and wires `/api/contact` →
`netlify/functions/contact.js` (SendGrid). Set `SENDGRID_API_KEY`,
`DELIVER_TO` (nicolefieldsphotos@gmail.com), and `SEND_FROM`
(forms@nicolefieldsphotography.net) as Netlify env vars — never in the repo.
Until then the form fails gracefully.

Run locally over http (not file://):

```bash
cd site
python3 -m http.server 8000     # or: npx serve .
```
