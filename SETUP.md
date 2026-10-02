# SETUP.md — one-time runbook

Everything needed to take this repository from a fresh clone to a live site
with a custom domain and a non-technical editor. Do the steps in order.
Whoever holds the main GitHub account (the developer) does steps 1–4 and 7;
the editor (Anna) only ever does step 5–6.

The stack: **Astro** (static site) → **GitHub Pages** (free hosting) →
**Sveltia CMS** at `/admin` (edits commit to the repo → the site rebuilds
automatically in ~2 minutes). The only cost anywhere is the domain
registration (~$11/yr).

---

## 1. Create the repository and push this code

1. Create a **public** repository named `anna-tsoka-architecture` under the
   main GitHub account (public is required for free GitHub Pages).
2. Push this code:
   ```sh
   git init -b main
   git add -A
   git commit -m "Initial site"
   git remote add origin git@github.com:YOUR-USERNAME/anna-tsoka-architecture.git
   git push -u origin main
   ```
3. Open `public/admin/config.yml` and replace `YOUR-USERNAME` in
   `backend.repo` with the actual GitHub username. Commit and push.

## 2. Enable GitHub Pages

1. Repository → **Settings → Pages**.
2. under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab) — the
   first deploy should go green and the site appears at
   `https://YOUR-USERNAME.github.io/anna-tsoka-architecture/`.

## 3. Custom domain

Buy the domain wherever you like — **Cloudflare Registrar** sells at cost
(~$10.44/yr for a `.com`, no markup, free WHOIS privacy) and you'll want a
free Cloudflare account anyway for analytics (step 7). A Cloudflare-bought
domain must use Cloudflare DNS, which is fine with GitHub Pages.

1. In Cloudflare DNS for the domain, add:
   - **A** records for the apex domain (`@`) to all four:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - **CNAME** for `www` → `YOUR-USERNAME.github.io`
   - Set both to **DNS only** (grey cloud) — proxying interferes with the
     Let's Encrypt certificate issuance.
2. Repository → **Settings → Pages** → **Custom domain** → enter the apex
   domain (e.g. `annatsoka.com`). Wait for the DNS check to pass.
3. Tick **Enforce HTTPS** once the certificate is provisioned (can take up
   to 24 h; usually minutes). GitHub also auto-redirects `www` ↔ apex.
4. Update the domain placeholder everywhere (only if you did **not** use
   `annatsoka.com`): search the repo for `annatsoka.com` — it appears in
   `astro.config.mjs` (`site`), `public/robots.txt` (Sitemap URL) and
   `public/admin/config.yml` (`site_url`). Additionally, in
   `astro.config.mjs`, change `base` from `/anna-tsoka-architecture` to `/`
   (the base is only needed while the site lives at the github.io project
   path). Commit and push.

## 4. Create the editor's GitHub login (for Anna)

Sveltia authenticates against GitHub, so Anna needs a GitHub account — but
only as a **login credential**. She will never look at the GitHub UI.

1. Create a GitHub account for her, e.g. `annatsoka-studio`
   (github.com/signup). Note the password somewhere safe (password manager).
2. Repository → **Settings → Collaborators** → **Add people** → invite the
   account, accept the invitation from her inbox (one time only).

## 5. Editor's first login (Anna, once per browser)

1. Open `https://YOUR-DOMAIN/admin` (or the `github.io` URL before the
   domain is set up).
2. Click **Sign In with Token**.
3. In the dialog, use the link to GitHub's token page — it opens with the
   right permissions preselected. Make sure the token settings are:
   - **Fine-grained** token
   - **Repository access → Only select repositories** → `anna-tsoka-architecture`
   - **Permissions → Contents: Read and write**
   - Expiration: set to **No expiration** (or the longest offered; if it
     ever expires, this step is simply repeated)
4. **Generate token**, copy it, paste it into the Sveltia dialog.
5. Done — the browser remembers the token. On a new device/browser, repeat
   this step. Store the token in a password manager if you want to avoid
   regenerating it.

## 6. Editing content (Anna, everyday use)

Open `/admin`, log in if asked. Everything saves straight to the live site
on **Save** — the site rebuilds and is live in ~2 minutes. Nothing can be
permanently lost: every save is a point in history the developer can roll
back.

- **Projects** — one entry per project. The `order` field sets its position
  on the home-page grid (10, 20, 30…). The **Page content** list builds the
  project page top-to-bottom: add *Text section* blocks and *Image set*
  blocks in any order/number. In an image set, images pair up two-by-two —
  a pair shows side by side when at least one of the two is portrait, and
  full width otherwise. The site detects this automatically.
- **Home page & carousel** — the intro paragraph and the carousel images
  (16:9 crops look best; any landscape photo works, it is center-cropped).
- **About page** — portrait, heading, bio (blank line = new paragraph) and
  the services list.
- **Footer & contact** — email, Instagram link, city.

Photos: just drop in the full-size camera JPEGs (even HEIC from an iPhone).
They are automatically converted to WebP, resized to max 2560px, and
stripped of EXIF data **before** being committed — the site never stores or
publishes the originals. Keep your originals on your computer.

## 7. Cloudflare Web Analytics (optional, free, cookieless)

1. Cloudflare dashboard → **Web Analytics** → **Add a site** → enter the
   domain → choose **Manual setup** → copy the **token** shown.
2. GitHub repository → **Settings → Secrets and variables → Actions →
   Variables** → **New repository variable**: name
   `PUBLIC_CF_BEACON_TOKEN`, value = the token.
3. Re-run the deploy workflow (Actions tab). The beacon is now on every
   page. Visitor stats appear in Cloudflare within the hour.

## Troubleshooting

- **Save in /admin fails with "Resource not accessible by personal access
  token"** — the token lost or never had Contents write permission.
  Regenerate per step 5.
- **Site didn't update after a save** — check the **Actions** tab: the
  latest *Deploy to GitHub Pages* run shows the error (usually a content
  typo, e.g. a missing required field).
- **Custom domain shows GitHub's 404** — DNS records wrong or still
  propagating (can take up to a few hours); verify with
  `dig +short annatsoka.com` — it must answer with the four `185.199.x.153`
  addresses.
- **Images look huge in the repo** — they shouldn't: uploads are compressed
  in the browser. If someone bypassed the CMS and committed originals,
  replace the file via the CMS (delete + re-upload).
- **Locked out / broken site** — everything is in git. From the repository,
  any previous commit can be restored (ask the developer).
