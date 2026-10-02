# anna-tsoka-architecture

Portfolio site for Anna Tsoka Architecture — static, free to host, edited
through a browser CMS.

- **Site**: [Astro](https://astro.build) → static build → **GitHub Pages**
- **CMS**: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin`
  — edits commit to this repository, GitHub Actions rebuilds the site
- **Content**: plain files — `src/content/projects/*.md` (projects),
  `src/content/{home,about,settings}.yml`, images in `public/uploads/`
- **License**: all rights reserved (see `LICENSE`)

## Local development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static build into dist/
```

## One-time setup / operations

See **[SETUP.md](./SETUP.md)** for the complete runbook: creating the
repository, enabling Pages, the custom domain + DNS, the editor's GitHub
token login, and analytics.

## How content maps to the site

| Collection (in `/admin`) | File | Renders as |
| --- | --- | --- |
| Projects | `src/content/projects/*.md` | home-page grid (order field) + `/projects/<slug>/` |
| Home page & carousel | `src/content/home.yml` | carousel (16:9 crop) + intro heading |
| About page | `src/content/about.yml` | `/about/` |
| Footer & contact | `src/content/settings.yml` | footer + About contact block |

Project pages are built from ordered **blocks**: text sections (title,
subtitle, paragraphs) and image sets. Within an image set, images are placed
in consecutive pairs — a pair sits side by side when at least one of the two
is portrait, otherwise each image spans the full width. Portrait/landscape is
detected automatically at build time.

Every uploaded image is compressed in the browser (WebP, quality 85, longest
side 2560px, EXIF stripped) before it is committed — keep originals
somewhere safe, they are not stored in the repository.
