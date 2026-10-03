# SEO & social link previews — research notes

Researched October 2026 against primary sources only (specs and first-party
docs). These notes drove the changes in this repo and stay useful as a
reference when content or the domain changes. Companion note:
[image-optimization-and-sveltia-guidelines.md](./image-optimization-and-sveltia-guidelines.md).

## How link previews work

When a URL is pasted into WhatsApp, X, LinkedIn, Facebook, iMessage, Slack or
Discord, the platform's crawler fetches the page HTML and reads `<meta>`
tags from the `<head>` — Open Graph (`og:*`) tags primarily, X Card
(`twitter:*`) tags secondarily. It renders a card (image, title, description,
domain) and **caches it by URL**: the preview only changes after a re-scrape
(debuggers below) or a URL change. Google is separate: it reads `<title>`,
`<h1>`, `og:title`, meta description, canonicals, sitemaps and structured
data for its index and results page.

## Platform requirements (from official docs)

| Platform | Tags read | Image requirements | Source |
|---|---|---|---|
| Open Graph (spec) | og:title, og:type, og:url, og:image required; og:description, og:site_name optional; structured props (og:image:width/height/alt/type) go **immediately after** og:image | **No minimum size or ratio in the spec** — dimension advice comes from Meta's docs, not the spec | [ogp.me](https://ogp.me/) |
| Facebook / Instagram | og:url, og:title, og:description, og:image; og:image:width/height recommended ("ensure that the image loads properly the first time it's shared") | min 200×200; **preferred 1200×630**; ratio "as close to 1.91:1 as possible"; max 8 MB; cache keyed to URL | [Sharing webmasters](https://developers.facebook.com/docs/sharing/webmasters/), [images](https://developers.facebook.com/docs/sharing/webmasters/images/) |
| LinkedIn | exactly four: og:title, og:image, og:description, og:url (no twitter:* support) | min **1200×627**, ratio 1.91:1, max 5 MB; <401px wide shows as a tiny thumbnail; no official title/description truncation limits published | [Make your site shareable](https://www.linkedin.com/help/linkedin/answer/a521928), [Post Inspector help](https://www.linkedin.com/help/linkedin/answer/a6233775) |
| X / Twitter | twitter:card has **no og fallback** and is required for anything beyond a default; og:* fills title/description/image when twitter:* equivalents are absent ("a summary card may be rendered") | summary_large_image: 2:1, min 300×157, max 4096×4096, <5 MB; JPG/PNG/WEBP/GIF (SVG not supported). **X removed its Cards docs** — last archived official spec Dec 2023, medium confidence | [Archived markup page](https://web.archive.org/web/2023/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup), [archived summary_large_image](https://web.archive.org/web/2023/https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image) |
| WhatsApp | og:image/description/url; `<head>` must appear **within the first 300KB of HTML** | absolute URL; **under 600KB**; ≥300px wide; aspect ratio ≤4:1; og:description ~80 chars suffice; otherwise "the link may not be previewed" | [Link previews doc](https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews) |
| Slack / Discord | og:* and twitter:* ("crawls the URL, looks for common OpenGraph and X Card metadata") | no official image size limits | [Slack unfurling](https://docs.slack.dev/messaging/unfurling-links-in-messages/), [Discord embeds](https://discord.discord.com/developers/resources/message) |
| Apple iMessage | officially undocumented — behaves like a standard og:* reader with its own cache | — | (no first-party docs exist) |

**The one image that satisfies everyone:** a **1200×630 JPEG under 600KB** —
hits Meta's preferred size and 1.91:1, LinkedIn's 1200×627 minimum, X's
2:1-ish large card, WhatsApp's width/ratio/file-size caps. No major
scraper's official docs list **AVIF**, and Meta/LinkedIn don't list WebP
either — so og:image must be a JPEG/PNG even though the site serves AVIF/WebP
in-page (Google Images, by contrast, supports both).

## Corrections to widely-repeated advice

- "ogp.me requires 1200×630 / 200×200 minimum" — **false**; those numbers are
  Meta's, the OGP spec has no image minimums.
- "X wants 1200×628" — **not in official docs**; official figures are 2:1,
  300×157 min, 4096×4096 max, <5 MB.
- "WhatsApp has a 300KB image limit" — **conflated**; 300KB is the HTML-head
  cap, the image cap is 600KB.
- "Use schema.org ProfessionalService for a studio" — **deprecated type**
  ("deprecated due to confusion with Service"), adds nothing; use
  Organization / LocalBusiness / Person instead.
- "Meta image limit is 5MB" — Meta's is **8 MB**; 5 MB is X's.

## Google essentials (all applied in this repo)

- Unique, concise `<title>` per page ("Page — Site" pattern), unique meta
  descriptions; both truncated "as needed" — no official pixel/char limits.
  Sources: [title links](https://developers.google.com/search/docs/appearance/title-link),
  [snippets](https://developers.google.com/search/docs/appearance/snippet).
- Self-referencing **absolute** canonical in `<head>` on every page
  ([consolidate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
- `Sitemap:` line in robots.txt is officially supported by Google/Bing
  ([robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt),
  [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)).
- `<h1>` and `og:title` are title-link sources; alt text is "the most
  important attribute" for image SEO
  ([Google Images](https://developers.google.com/search/docs/appearance/google-images)).
- Structured data: JSON-LD recommended; Organization markup has **no required
  properties** (logo must be ≥112×112px); **ProfilePage + Person** is an
  actual Google feature for about-pages; LocalBusiness requires name +
  address and fits businesses with public premises. None of these guarantee a
  search feature ("Google does not guarantee" display).
  Sources: [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization),
  [LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business),
  [ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

## What this repo does (as of Oct 2026)

- `src/layouts/BaseLayout.astro` — per-page og:*/twitter:* tags; og:image is a
  dedicated **1200×630 JPEG (quality 80) center-crop** of the page's photo
  (`getImage({ fit: 'cover' })`), falling back to the branded
  `public/og-default.jpg`; `og:image:width/height/alt/type` emitted per OGP
  ordering; Organization JSON-LD site-wide; `theme-color` #111.
- `src/pages/about.astro` — ProfilePage + Person JSON-LD (a Google feature).
- `src/pages/robots.txt.ts` — robots.txt generated at build so the Sitemap
  URL always matches `site` + `base` (correct under the github.io base path
  today, at the domain root after the flip; pattern from the
  [@astrojs/sitemap docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/)).
- `@astrojs/sitemap` — sitemap-index.xml, `/admin` filtered.
- Canonical/og URLs follow the **host that is actually live**: the deploy
  workflow reads the final URL from the GitHub Pages API (`html_url`) into
  `SITE_URL`, and `astro.config.mjs` derives `site` + `base` from it —
  `geoioannid.github.io/anna-tsoka-architecture` until the custom domain is
  configured in repository Settings → Pages, `annatsoka.com` afterwards.
  Migrating is re-running the workflow, no code edits (SETUP.md step 3).

## Validation tools

- Facebook/Meta Sharing Debugger (login required, "Scrape Again" re-caches):
  <https://developers.facebook.com/tools/debug/>
- LinkedIn Post Inspector: <https://www.linkedin.com/post-inspector/>
- X: no public validator anymore (Card Validator is login-walled; docs
  removed) — test by posting the URL.
- Google Rich Results Test / schema validator: search "Rich Results Test".
- Google Search Console: submit `sitemap-index.xml`, watch coverage.

## Caveats

- All X/Twitter specifics carry medium confidence: live docs removed,
  archived Dec 2023 official pages are the last word.
- Apple publishes nothing about iMessage previews — treat it as a standard
  og:* reader and expect opaque caching.
- LinkedIn/Facebook/WhatsApp caches key on URL: after swapping an image,
  re-scrape (or the new hashed Astro filename changes the URL automatically).
