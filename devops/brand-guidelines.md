# Brand Guidelines — Nicole Fields Photography

> **Confidence: LOW (provisional).** No logo, colors, or fonts were recoverable
> from the source domain (parked placeholder, egress-blocked). The system below
> is a **design proposal** for owner sign-off, not extracted brand truth.

## Art direction — "Liquid Glass"

Frosted, translucent glass panels layered over a soft, warm **aurora** wash.
Content floats on blurred glass with fine specular edges and gentle depth —
light, airy, and modern, which suits a relaxed family/lifestyle photographer.
The photography is the hero; the glass is the quiet frame around it.

## Color tokens

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--accent` | `#e8735e` | `#ff8f78` | Warm coral — primary actions, highlights |
| `--accent-2` | `#6b8f9c` | `#8fb3c0` | Soft slate — secondary |
| Aurora stops | `#ffd9c7 · #f7c9d9 · #d9e2f2 · #cfe8e0` | deep plum/indigo/teal | Ambient background wash |
| Neutral ground | `#f7f4f1` (warm ivory) | `#14110f` (warm near-black) | Canvas behind the glass |
| Ink | `#1c1a17` | `#f3efe9` | Text |
| Glass fill | `rgba(255,255,255,.55)` | `rgba(38,34,30,.5)` | Panel surface |
| Glass edge | `rgba(255,255,255,.6)` | `rgba(255,255,255,.14)` | Specular border |

Neutrals are warm-biased (toward the coral accent), not pure grey.

## Type

CSP/offline-safe system pairing (no webfont dependency):

- **Display:** `"Georgia", "Iowan Old Style", serif` — warm, human, editorial.
- **Body / UI:** system sans (`-apple-system, "Segoe UI", Roboto, …`).
- **Labels:** body sans, uppercase, `letter-spacing: .22em`.

If the owner approves webfonts later, `Fraunces` (display) + `Inter` (body)
are the intended upgrade.

## Motion

Subtle only: scroll-reveal, glass hover lift, an ambient slow drift on the
aurora. Everything respects `prefers-reduced-motion`.
