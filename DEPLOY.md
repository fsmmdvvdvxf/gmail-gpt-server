# Deploy — Nicole Fields Photography

The site is a static site in `site/` plus two Netlify Functions (contact form +
editable content store). The repo is deploy-ready: `netlify.toml` at the root
tells Netlify everything it needs. Deploying takes ~2 minutes and happens on
Netlify's servers from this GitHub repo — no local build required.

## 1. Connect the repo to Netlify (one time)

1. Sign in at **https://app.netlify.com**.
2. **Add new site → Import an existing project → Deploy with GitHub**.
3. Choose the repo **`fsmmdvvdvxf/gmail-gpt-server`**.
4. Branch to deploy:
   - To go live with the current work **before merging**, pick
     `claude/photography-portfolio-site-uto3p0`.
   - Or merge the pull request first and deploy `main`.
5. Build settings auto-fill from `netlify.toml`:
   - **Base directory:** `site`
   - **Publish directory:** `site`
   - **Functions directory:** `site/netlify/functions`
   - (No build command — it's a static site.)
6. Click **Deploy**. You'll get a `*.netlify.app` URL in about a minute.

Every future `git push` to that branch redeploys automatically.

## 2. Set environment variables

Netlify → **Site configuration → Environment variables**. None are required for
the site to load, but these turn on features:

| Variable | Enables | Notes |
|----------|---------|-------|
| `ADMIN_KEY` | Saving in the `/admin` editor | Pick any strong password; this is what Nikki types to log in. |
| `SENDGRID_API_KEY` | Contact-form email | From your SendGrid account. |
| `DELIVER_TO` | Where inquiries land | The inbox that should receive contact messages. |
| `SEND_FROM` | From-address for the form | e.g. `forms@yourdomain` (needs SendGrid domain auth). |

After adding/changing env vars, trigger a redeploy (**Deploys → Trigger deploy**)
so the functions pick them up.

## 3. Custom domain (optional)

Netlify → **Domain management → Add a domain**. Point `nicolefieldsphotography.net`
(or any domain) at Netlify per their DNS instructions; HTTPS is automatic.

## What works with / without setup

- **No env vars:** all pages, gallery, and design work. The contact form fails
  gracefully; the `/admin` editor still works but keeps changes on that device
  only (use its Export/Import to back up).
- **`ADMIN_KEY` set:** `/admin` saves globally — edits show for all visitors via
  Netlify Blobs, no redeploy needed.
- **SendGrid vars set:** the contact form emails inquiries.

## Still to do before a public launch

- Replace the generated placeholder photos with Nikki's real galleries.
- Confirm and add her real email / social links (in `/admin` → Contact).
- Add real pricing if desired (otherwise services show "Inquire").

See `site/BUILD-REPORT.md` and `devops/questions-for-owner.md` for the full list.
