# carlojaeavila.dev

Personal landing page / portfolio for Carlo Jae Avila (**blackb3ard**) — mobile security researcher based in Manila. Live at [carlojaeavila.dev](https://carlojaeavila.dev).

## What this is

A single-page portfolio covering:

- **About** — bio and current focus: mobile application security, red teaming, OSINT, offensive tooling
- **Currently** — work history / affiliations (Secuna, hackstreetboys CTF team)
- **Certifications & training** — CAAH, OMSE, eMAPT, eWPTXv2, plus ongoing HTB/TryHackMe/TCM Security training
- **CVEs** — disclosed vulnerabilities, each linking out to a full technical write-up on the sister site
- **Projects** — open-source work
- **Find me** — social and contact links

## Architecture

No framework, no build step, no dependencies — plain HTML/CSS/JS:

```
index.html      All markup, single page, anchor-linked sections
style.css       All styling — design tokens as CSS custom properties
script.js       IntersectionObserver-based active-nav-link highlighting
images/         Cert badges, company logos
favicon.png     Android "bugdroid" mascot (official Google asset, CC BY 3.0)
```

### Design

Dark, terminal-inspired aesthetic — JetBrains Mono throughout, a blinking-cursor motif, and a glitching "attack surface scan" mockup in the hero. Colors, spacing, and border-radius are defined once as CSS custom properties near the top of `style.css` and reused everywhere; there's no separate design-tokens file or build tooling, just disciplined variable reuse.

Responsive down to mobile via a single breakpoint (`max-width: 640px`) that collapses the multi-column sections (hero, currently, certs, cves, projects) into single-column stacks.

## Deployment

Static files are deployed as-is via **GitHub Actions → GitHub Pages** (`.github/workflows/deploy.yml`) — no build step; the repo root is uploaded directly as the Pages artifact on every push to `main`.

**DNS/domain** is managed through **Cloudflare**:

- `carlojaeavila.dev` (apex) → `CNAME @ → blackbeard666.github.io`, proxied. Cloudflare supports *CNAME flattening* at the zone apex — plain DNS forbids a CNAME record at the root, which is specifically why Cloudflare (not just any DNS host) is used here.
- `www.carlojaeavila.dev` → `CNAME www → blackbeard666.github.io`, proxied — required so GitHub can serve the `www` → apex redirect; without it, GitHub Pages flags the domain as "improperly configured."
- The custom domain is registered under this repo's **Settings → Pages → Custom domain**, with HTTPS enforced.
- The workflow's `configure-pages` step sets `enablement: true` — without it, the very first deploy on a brand-new repo can fail (`Error: Get Pages site failed`), since the Pages "site" object isn't reliably created just by selecting "GitHub Actions" in the Settings UI.

## Local development

Open `index.html` directly in a browser — no server, no build step.

## Sister site

Full technical writeups and CVE deep-dives live at [path2pwn.carlojaeavila.dev](https://path2pwn.carlojaeavila.dev) ([repo](https://github.com/blackbeard666/path2pwn)) — a separate Hugo site, since GitHub Pages requires one repo per site.
