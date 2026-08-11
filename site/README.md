# Nicole Fields Photography — Website

A fast, responsive, image-forward brochure site for a wedding &amp; portrait
photography business. Built as static HTML/CSS/JS with a single serverless
contact function — no build step, no framework.

## Design

- **Editorial + Apple-inspired minimalism** — clarity, deference, depth. Generous
  whitespace, one primary action per view, subtle 60fps micro-interactions.
- **Type:** Fraunces (display serif) + Inter (body), via Google Fonts.
- **Palette:** warm ivory / bronze accent, with a full **dark mode** (toggle in the
  nav: system → light → dark) that also respects the OS setting.
- Fully responsive down to small phones; honors `prefers-reduced-motion`.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, statement, featured gallery, about teaser, services, testimonials, CTA |
| `portfolio.html` | Filterable masonry gallery with keyboard-navigable lightbox |
| `about.html` | Photographer story, values, behind-the-scenes |
| `services.html` | Service categories, pricing tiers, process, FAQ accordion |
| `contact.html` | Inquiry form (wired to the serverless function) + details |
| `404.html` | Friendly not-found page |

Shared `header`/`footer` live in `partials/` and are injected client-side by
`assets/js/site.js`, so nav is defined once.

## Run locally

Because pages fetch the header/footer partials, open the site through a local
server (not `file://`):

```bash
cd site
npx serve .          # or: python3 -m http.server 8000
```

## Deploy (Netlify)

```bash
cd site
netlify deploy --prod
```

`netlify.toml` sets the publish dir and wires `/api/contact` to the serverless
function. To make the contact form send email, set these environment variables
in the Netlify dashboard (never commit them):

| Var | Purpose |
|-----|---------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `DELIVER_TO` | Inbox that receives inquiries |
| `SEND_FROM` | `forms@nicolefieldsphotography.net` (domain must be SendGrid-authenticated) |
| `RECAPTCHA_SECRET` | *(optional)* reCAPTCHA v3 secret for spam scoring |

Until those exist, the form fails **gracefully** with a friendly message rather
than erroring — so it's safe to launch pre-provisioning.

## ⚠️ Placeholders to replace before launch

This site was scaffolded from a request rather than a completed brand-intake, so
the following are **tasteful stand-ins, not real business data** — swap them
before going live:

1. **Photos** — every image loads from `picsum.photos` (random placeholder
   photography). Replace with Nicole's real galleries. Search the source for
   `picsum.photos` to find them all.
2. **Business details** — name (*Nicole Fields Photography*), tagline, city
   (Portland, OR), email, phone, and social links are illustrative. Update in
   `partials/header.html`, `partials/footer.html`, and `contact.html`.
3. **Copy** — the About story, testimonials, and stats are written as realistic
   examples. Confirm or replace with the owner's real words and approved reviews.
4. **Pricing** — the collections and prices in `services.html` are placeholders;
   set the real numbers.
5. **Favicon** — currently an inline "NF" monogram SVG; swap for a real mark if
   desired.

The source URL provided (a parked-domain placeholder for
`nicolefieldsphotography.net`) was unreachable / carried no business content,
so nothing here was scraped or invented from it — it's a clean scaffold ready
for real assets.
