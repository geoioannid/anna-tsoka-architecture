# Research: Astro image optimization & Sveltia CMS editor guidance

Primary-source research, October 2026. Every claim links to the source that owns it
(official docs, source repo, or a file in this repository). The repo previously had no
`docs/` directory (root has `README.md` and `SETUP.md`); this file starts `docs/research/`.

**Repo state this is grounded against** (all paths in this repo):

- `astro.config.mjs` — no `output` key (Astro's default is static output), `site: https://annatsoka.com`, `base: '/anna-tsoka-architecture'`, Tailwind 4 via `@tailwindcss/vite`.
- `package.json` — `astro ^7.3.5`, `sharp ^0.35.5` as a direct dependency.
- `public/admin/index.html` — loads the **standard Sveltia build** `@sveltia/cms@0.227.2` from unpkg (not the Sveltia_localsafe variant).
- `public/admin/config.yml` — Decap-compatible Sveltia config; `media_folder: public/uploads`, `media_libraries.all.transformations.raster_image` (webp / quality 85 / 2560px), `hint:` on many fields.
- `src/content.config.ts` — image fields (`cover`, `image`) are `z.string()` holding `/uploads/...` public paths, **not** Astro's `image()` helper.
- `src/lib/images.ts` — uses `sharp().metadata()` at build time to read dimensions of files under `public/`.
- `.github/workflows/deploy.yml` — `npm ci` + `astro build` on `ubuntu-latest`, `upload-pages-artifact`, `deploy-pages`.

---

## A. Astro image optimization & responsive images on a fully static host

### A1. Image services for `output: 'static'`; the responsive-images feature and its status

- **Sharp is the default image service**: "Sharp is the default image service used for `astro:assets`." The default config is `{ entrypoint: 'astro/assets/services/sharp', config: {} }`. When using pnpm, sharp "may need to be" installed manually ("`pnpm add sharp`") even though it is an Astro dependency; npm installs it normally. (This repo uses npm and additionally pins `sharp` in `package.json`.)
  Sources: <https://docs.astro.build/en/guides/images/> · <https://docs.astro.build/en/reference/configuration-reference/>
- Astro's Image Service API supports **Local services** (wrappers around Sharp, ImageMagick, Squoosh, etc., run at build time for static output or via an endpoint at runtime) and **External services** (remote URLs such as Cloudinary, ImageKit, Vercel, or any RIAPI-compliant server). A no-op `passthroughImageService()` exists for hosts/adapters that cannot run Sharp.
  Source: <https://docs.astro.build/en/reference/image-service-reference/>
- **Responsive images are a stable feature as of Astro 5.10.0 (June 2025) — not experimental.** The changelog entry for PR [#13917](https://github.com/withastro/astro/pull/13917) ("feat: unflag responsive images", merged 2025-06-19): "The responsive images feature introduced behind a flag in v5.0.0 is no longer experimental and is available for general use… Enable the `image.responsiveStyles` option… set a `layout` attribute on any `<Image />` or `<Picture />` component, or configure a default `image.layout`, for instantly responsive images with automatically generated `srcset` and `sizes` attributes." The same entry states: "The `experimental.responsiveImages` flag has been removed, and all experimental image configuration options have been renamed to their final names."
  Sources: [CHANGELOG 5.10.0](https://github.com/withastro/astro/blob/astro%406.0.0/packages/astro/CHANGELOG.md) · <https://github.com/withastro/astro/pull/13917>
- **Timeline**: flag introduced experimental in v5.0.0-beta.9 (changelog: "This feature is experimental and may change in future versions"); extended to Markdown `![]()` images in v5.4.0; unflagged in v5.10.0. The current experimental-flags page (checked against Astro 7.x docs) lists no responsive-images flag.
  Sources: [CHANGELOG (pre-6.0.0 tag, containing all 5.x entries)](https://github.com/withastro/astro/blob/astro%406.0.0/packages/astro/CHANGELOG.md) · <https://docs.astro.build/en/reference/experimental-flags/>
- **What `layout` offers vs. manual `widths`/`densities`/`sizes`**: with a `layout` set (`constrained` | `full-width` | `fixed`; per-component `layout` prop or global `image.layout`), Astro "automatically generate[s] the required srcset and sizes values" from the image's intrinsic dimensions, the layout type, and `image.breakpoints` (defaults `[640, 750, 828, 1080, 1280, 1668, 2048, 2560]` for local services). Example in docs: an 800×600 `constrained` image emits `srcset` entries 640w–1600w plus `sizes="(min-width: 800px) 800px, 100vw"`, `loading="lazy"`, `decoding="async"`, `style="--fit: cover; --pos: center;"`, `data-astro-image="constrained"`.
  Sources: <https://docs.astro.build/en/guides/images/> · <https://docs.astro.build/en/reference/configuration-reference/>
- **`image.responsiveStyles`** (boolean, default `false`, added astro@5.10.0): when `true`, Astro "applies a small number of global styles to ensure that your images resize correctly" (via `:where([data-astro-image])`, `object-fit: var(--fit)`, `object-position: var(--pos)`; `width: 100%` for full-width, `max-width: 100%` for constrained). Because `:where()` has zero specificity the styles are easy to override. **Tailwind 4 caveat (relevant to this repo, which uses Tailwind 4)**: the docs note Astro's styles and Tailwind's cascade layers interact — "Astro's styling will take precedence over Tailwind styling" — so Tailwind users are told to leave `responsiveStyles` at its default `false`. A later fix (7.x) wraps the generated styles in `@layer astro.images` so user-defined layers win.
  Sources: <https://docs.astro.build/en/guides/images/> · <https://docs.astro.build/en/reference/configuration-reference/> · [CHANGELOG #17141](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md)
- Related config: `image.objectFit` (default `"cover"`), `image.objectPosition` (default `"center"`), `image.breakpoints`, all requiring a layout to matter. Per-image `fit`/`position` props override them.
  Source: <https://docs.astro.build/en/reference/configuration-reference/>

### A2. How `astro:assets` Image/Picture generate srcset; Markdown/content-collection constraints

- **Manual responsive control** (independent of `layout`): `widths` ("A list of widths to generate for the image", producing `NNNw` descriptors) — "A `sizes` property must also be provided." `densities` (e.g. `1.5x`, `2x`) — "Do not provide a value for `widths` when using this value," and densities are "not compatible with having the layout prop or `image.layout` config set, and will be ignored if set." Widths/densities larger than the original image are ignored "to avoid upscaling"; since Astro 6.0 "the default image service never upscales images."
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/> · <https://docs.astro.build/en/guides/upgrade-to/v6/>
- When a `layout` is set, `widths`/`sizes` "will be automatically generated" and manually supplied values override the generated ones.
  Source: <https://docs.astro.build/en/reference/modules/astro-assets/>
- `<Picture />` accepts `formats` (default `['webp']`, order matters), `fallbackFormat` (defaults to png, or jpg for JPEG sources, gif for animated, svg for SVG), and `pictureAttributes`. It emits `<source>` tags per format plus a fallback `<img>`. **Art direction** (a different image file per breakpoint/media query on `<source>`) is **not documented** on the Picture component or the images guide.
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/> · <https://docs.astro.build/en/guides/images/>
- **`.md` vs `.mdx`**: in `.md` files the `![]()` syntax works and local `src/` and remote images are processed; `<Image />`/`<Picture />` components are "unavailable in `.md`" — use MDX for component-level control of images from Markdown.
  Source: <https://docs.astro.build/en/guides/images/>
- **Content collections**: reference images in frontmatter with a path **relative to the content file** (e.g. `cover: "./firstpostcover.jpeg"`), validate with the `image()` schema helper, then pass the entry (e.g. `post.data.cover`) as `src` to `<Image />`/`getImage()` from the page/layout component.
  Source: <https://docs.astro.build/en/guides/images/>
- **`public/` images are never optimized**: "images stored in your `public/` folder" require manual `width`/`height` "as Astro is unable to analyze these files," and public images are excluded from optimization/responsive behavior entirely — including Markdown images. This applies to every CMS-uploaded image in this repo today (see "Implications").
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/> · <https://docs.astro.build/en/guides/images/>
- `inferSize` (default `false`) auto-detects remote-image dimensions; since 5.17.3 it only fetches dimensions "for authorized remote image domains" (`image.domains` / `image.remotePatterns`).
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/> · <https://docs.astro.build/en/reference/configuration-reference/>

### A3. GitHub Pages specifics: no server resizing; caching

- GitHub Pages is "a static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository on GitHub" and "optionally runs the files through a build process, and publishes a website." No server-side image processing exists. GitHub's official Pages documentation does not document `Cache-Control` values, CDN behavior, or any header configuration for Pages sites.
  Source: <https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages>
- Astro's **caching guide covers only on-demand (server) rendered pages and endpoints**: "Astro provides a platform-agnostic API for caching responses from on-demand rendered pages and endpoints." It says nothing about static-asset headers, `_astro/`, or GitHub Pages. Astro's official GitHub Pages deploy guide likewise documents nothing about caching, asset headers, or image handling in the workflow.
  Sources: <https://docs.astro.build/en/guides/caching> · <https://docs.astro.build/en/guides/deploy/github/>
- The project's own tracker records that Astro-generated assets are content-hashed and therefore safely cacheable long-term: issue [#9106](https://github.com/withastro/astro/issues/9106) ("Assets Cache-Control should be more aggressive") — "static assets, with a hash in their filenames, get by default a max-age=0 cache control policy"; the reporter notes "The default max-age could be 1 year… because assets have a hash of their contents in the file name." Closed by PR [#9125](https://github.com/withastro/astro/pull/9125). (The configuration reference itself documents `build.assets` — default `_astro` — without hashing language.)
  Sources: <https://github.com/withastro/astro/issues/9106> · <https://docs.astro.build/en/reference/configuration-reference/>
- **Build-time image cache**: processed images are "cached during builds in `./node_modules/.astro`" (configurable via `cacheDir`), and the docs state that "preserving the cache between builds improves build time and bandwidth." Remote images follow HTTP `Cache-Control`/`Last-Modified`/`Etag` semantics with revalidation since astro@5.1.0.
  Source: <https://docs.astro.build/en/guides/images/>

### A4. Sharp service configuration and build-time cost

- Sharp service options live under `image.service.config`: `limitInputPixels` (default `true`), `kernel` (default `undefined`, "maps to Sharp's default kernel of lanczos3"), and per-format encoder option objects `jpeg`, `webp`, `avif`, `png` (added astro@6.1.0) that pass default encoder options through to sharp — "Per-image quality values from `<Image />`, `<Picture />`, and `getImage()` still take precedence."
  Source: <https://docs.astro.build/en/reference/configuration-reference/>
- **Output formats/quality at the component level**: `<Image />` "will produce a .webp file" by default (`format` overrides); `quality` accepts presets (`low`, `mid`, `high`, `max`) "or a number from 0 to 100 (interpreted differently between formats)."
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/>
- **Build-time cost**: the responsive-images documentation warns that generating multiple sized variants per image "may increase the build time" for prerendered pages. Mitigation documented by Astro: the build-time processed-image cache in `node_modules/.astro` (see A3). No numeric build-time figures are published. Sharp availability: it is an Astro dependency (npm installs it automatically; pnpm users add it manually — see A1), and Astro 6's Sharp service additionally rasterizes SVGs.
  Sources: <https://docs.astro.build/en/guides/images/> · <https://docs.astro.build/en/guides/upgrade-to/v6/>

### A5. LCP / priority / eager loading

- The `priority` prop (default `false`, added astro@5.10.0) "allows you to automatically set the loading, decoding, and fetchpriority attributes to their optimal values for above-the-fold images" — it emits `loading="eager"`, `decoding="sync"`, `fetchpriority="high"`; the individual attributes remain manually settable. Default output without `priority` is `loading="lazy"`, `decoding="async"`; components accept all native `<img>` attributes.
  Sources: <https://docs.astro.build/en/reference/modules/astro-assets/> · <https://docs.astro.build/en/guides/images/>
- The 5.10.0 changelog adds the project's only explicit LCP guidance: "You should only use the `priority` option for images that are critical to the initial rendering of the page, and ideally only one image per page. This is often an image identified as the [LCP element](https://web.dev/articles/lcp)… Using it for too many images will lead to performance issues, as it forces the browser to load those images immediately."
  Source: [CHANGELOG 5.10.0](https://github.com/withastro/astro/blob/astro%406.0.0/packages/astro/CHANGELOG.md)
- Since Astro 6, "redundant `fetchpriority=\"auto\"` attributes are now omitted from `<Image>` output." The current images guide contains no further preload/LCP guidance, and no art-direction guidance (see A2).
  Sources: <https://github.com/withastro/astro/releases/tag/astro%406.0.0> · <https://docs.astro.build/en/guides/images/>

---

## B. Sveltia CMS editor guidance & media constraints

### B1. Surfacing guidance to the editor: `hint`, `comment`, `pattern`, collection `description`

Sveltia's documented common field options are: `name`, `widget`, `label`, `comment`, `hint`, `required`, `pattern`, `readonly`, `preview`, `i18n`.
Source: <https://sveltiacms.app/en/docs/fields>

- **`hint` — rendered in the UI**: "A short description or hint for the field value, which provides additional context to users," "displayed below the field input in the UI." "Basic Markdown formatting is supported, including bold, italics, strikethrough, links, and inline code"; `\n` produces line breaks; "The hint is not displayed while the field is read-only."
  Source: <https://sveltiacms.app/en/docs/fields>
- **`comment` — NOT rendered in the UI**: "A comment to be added before the field in the output file," YAML-only ("Other formats, such as JSON and TOML, ignore this option"), and explicitly "The comment is not displayed in the UI; use the hint option to show a description to users."
  Source: <https://sveltiacms.app/en/docs/fields>
- **`pattern` + error message — rendered as validation**: "An array containing a regular expression pattern and an error message to validate the field's value" (regex as string `'^[A-Za-z0-9]+$'` or slash-delimited with flags `'/^[a-z0-9]+$/i'`); docs example error: "Only alphanumeric characters are allowed."
  Source: <https://sveltiacms.app/en/docs/fields>
- **Per-collection guidance**: collections accept `description` — "A brief description of the collection, displayed in the UI. Basic Markdown formatting is supported." `label` / `label_singular` also exist.
  Source: <https://sveltiacms.app/en/docs/collections/entries>
- Decap documents the same trio as widget options: `hint` ("optionally add helper text directly below a widget," markdown for "bold, italic, strikethrough, and links"), `pattern` ("a list with a regex pattern and an error message"), `comment` ("optional comment to add before the field (only supported for yaml)").
  Sources: <https://decapcms.org/docs/widgets/> · <https://decapcms.org/docs/configuration-options/>

### B2. Media library config: limits, file types, client-side processing on upload

- Sveltia's media processing is configured under **`media_libraries`** (new form) with `media_library` (singular) kept for backward compatibility; "if both are set, `media_libraries` wins." Options merge top-level → `all` → `default.config` → field level; nested `config` objects merge "only one level deep," arrays are replaced.
  Source: <https://sveltiacms.app/en/docs/media>
- **Upload transformations (in-browser)** — `media_libraries.all.transformations.raster_image`: `format` (**only `webp` supported**), `quality` (0–100, **default 85**), `width`/`height` ("max dimensions in pixels; larger images scale down, smaller are not scaled up"). Plus `transformations.svg.optimize: true` (SVGO minification). On upload: raster images (avif, gif, heic, jpeg, png, webp) are converted to WebP and resized in the browser; **Exif metadata is stripped**; if WebP encoding fails, PNG is used instead; Safari is slower (no native WebP encode; jSquash used); **AVIF output is not supported**; HEIC decoding uses libheif/WASM (~300 KB download; CSP needs `blob:` in `worker-src`). The docs state this "isn't for generating variants — that belongs in your framework's build step."
  Source: <https://sveltiacms.app/en/docs/media>
- **File-size limit**: `max_file_size` (bytes, default `Infinity`) settable top-level or per field; "The legacy `media_library.config.max_file_size` also works for internal storage."
  Source: <https://sveltiacms.app/en/docs/media>
- **File-type restriction**: File/Image fields accept `accept` (comma-separated MIME types or extensions, e.g. `.pdf`, `image/webp`). Filename handling: `slugify_filename: true` (uploads are **not** slugified by default — a behavioral difference from Decap) and `filename_template` (e.g. `'{{year}}{{month}}{{day}}-{{uuid_short}}'`, plus `{{slug}}` etc. in fields).
  Sources: <https://sveltiacms.app/en/docs/fields/file> · <https://sveltiacms.app/en/docs/media>
- **No image dimension/aspect-ratio enforcement**: the Image field page and File field page document no width/height/ratio validation; the only size constraints are the scale-down-only transformation `width`/`height` and `max_file_size`.
  Sources: <https://sveltiacms.app/en/docs/fields/image> · <https://sveltiacms.app/en/docs/fields/file>
- **Decap's own equivalents**: Decap configures media libraries via `media_library` (object with `name` and a `config` "passed to the library"); no `max_file_size` appears on Decap's configuration-options page. Decap's **`media_processing`** ("controls image transformations that run in the browser before Decap CMS saves uploads") was added in decap-cms **3.16.0** (release notes: "Support browser image transformations", PR [#7845](https://github.com/decaporg/decap-cms/pull/7845), merged 2026-08-21; release dated 2026-08-31): options `enabled`, `format.enabled`/`format.default` (jpeg|webp), `quality` (1–100), `strip_metadata`, `width`, `height`, `aspect_ratio` (e.g. "16:9" — center-crops); applies to JPEG/PNG/WebP only ("Unsupported image types, such as GIF and SVG, are uploaded unchanged"); field-level `media_processing` overrides global.
  Sources: <https://decapcms.org/docs/configuration-options/> · <https://decapcms.org/docs/widgets/> · <https://github.com/decaporg/decap-cms/releases> · <https://github.com/decaporg/decap-cms/pull/7845>
- **Sveltia does NOT support Decap's `media_processing`** — its migration guide lists it under differences and points to Sveltia's built-in optimizer ("Use that feature instead"), i.e. the `transformations` config above.
  Source: <https://sveltiacms.app/en/docs/migration/netlify-decap-cms>

### B3. Custom previews, custom widgets, i18n

- **Custom preview templates**: `CMS.registerPreviewTemplate(name, component)` — React component per collection/file; Svelte 5 / Vue 3 components work via React wrappers mounted into the preview iframe. Props include `entry`, `widgetFor`, `widgetsFor`, `getAsset`, `getCollection`, `fieldsMetaData`. Caveats: "Sveltia CMS may not be fully compatible with existing preview templates. Our implementation does not include any undocumented component props." Preview styles: `CMS.registerPreviewStyle()` with a file path or raw CSS (`{ raw: true }`); the preview is a sandboxed iframe that "doesn't inherit any stylesheets from the admin page."
  Source: <https://sveltiacms.app/en/docs/api/preview-templates>
- **Custom field types (custom widgets)**: `CMS.registerFieldType(name, control, [preview], [schema])` — "the `registerWidget` method is available as an alias with the same signature." Optional JSON-schema (draft-07) validation of the field's config; custom validation via an `isValid` method (boolean or `{ error: { message } }`). Reusing built-in controls via `getFieldType` is limited to `boolean, color, datetime, map, number, select, string, text, uuid`. Sveltia states: "We don't implement features not described in the Netlify/Decap CMS documentation."
  Sources: <https://sveltiacms.app/en/docs/api/field-types> · <https://sveltiacms.app/en/docs/migration/netlify-decap-cms>
- **i18n**: "first-class internationalization (i18n) support" (README). Field-level `i18n` values: `true`, `false` (default), `duplicate` — plus Decap's `translate`/`none` aliases. **No per-locale `hint`/`label` localization is documented** (no `hint_i18n`/`label_i18n` on the fields or i18n pages).
  Sources: <https://github.com/sveltia/sveltia-cms> · <https://sveltiacms.app/en/docs/i18n/options> · <https://sveltiacms.app/en/docs/fields>

### B4. Decap `hint` origin and whether Sveltia honors it

- `hint` is **not** a Decap 3.x addition. It was added to the codebase (when the repository was Netlify CMS — same repo, now `decaporg/decap-cms`) by PR [#1429](https://github.com/decaporg/decap-cms/pull/1429) "Add Hint Option to all Widgets", merged 2018-08-16, and is documented today as a common widget option on decapcms.org (helper text directly below a widget, markdown-supported).
  Sources: <https://github.com/decaporg/decap-cms/pull/1429> · <https://decapcms.org/docs/widgets/>
- **Sveltia honors `hint`** and renders it below the field input with basic Markdown (see B1); it also honors `pattern` + error messages, and treats `comment` as output-file-only (never shown in the UI). The repo's `public/admin/config.yml` already uses `hint:` on string/select/number/image/list fields and uses no `pattern`.
  Sources: <https://sveltiacms.app/en/docs/fields> · `public/admin/config.yml` (this repo)

---

## Implications for this repo

Statements of fact drawn from the above sources and the repo's files — no recommendations.

1. **No Astro image optimization currently runs on CMS images.** All CMS-uploaded images live in `public/uploads` and are stored in content as public URL strings (`cover: z.string()` etc. in `src/content.config.ts`). Per Astro's docs, images in `public/` "are never optimized" or made responsive, and cannot have dimensions inferred. Everything in Section A1/A2 (`image()`, `layout`, srcset generation, Sharp transforms) applies only to images Astro processes from `src/`, content collections, or authorized remote URLs — none of which this site uses.
2. **The only sharp usage today is dimension probing.** `src/lib/images.ts` calls `sharp().metadata()` on `public/uploads/*` at build time for portrait/landscape layout decisions — a build-time-only, no-transform usage (plus `sharp ^0.35.5` pinned in `package.json`).
3. **Responsive-images features are stable in the installed Astro version.** This repo runs Astro 7.3.5; responsive images (`layout`, `image.responsiveStyles`, `priority`) became stable in 5.10.0 and carry no experimental flag. Astro 6 changed style emission to build-time classes/data attributes and made never-upscale the default; Astro 7 lists no image-related breaking changes. The documented Tailwind 4 interaction with `responsiveStyles` is relevant because this repo uses Tailwind 4.
4. **Image compression is done by Sveltia in the browser, before commit.** `public/admin/config.yml`'s `media_libraries.all.transformations.raster_image` (webp, quality 85, width/height 2560) exactly matches Sveltia's documented transformation schema (webp-only output, quality default 85, scale-down-only caps, EXIF stripped). Decap's `media_processing` would not apply here — Sveltia doesn't support it. Uploaded files therefore arrive as already-compressed `.webp` in the repo (existing seed `.jpg` files in `public/uploads` predate/differ from that pipeline).
5. **Editor guidance in this repo's config is rendered by Sveltia.** The `hint:` properties used throughout `public/admin/config.yml` are displayed below the field input with Markdown support; a collection-level `description:` is available but unused; `comment:` would only write YAML comments (invisible in the editor); `pattern:` + error message is available for string validation but unused. Sveltia's Image fields have no documented dimension/aspect-ratio enforcement — only scale-down caps and `max_file_size`.
6. **GitHub Pages offers no server-side resizing and no documented cache-header control**; Astro's caching guidance covers on-demand rendering only, so on Pages the effective caching behavior is entirely GitHub's (undocumented in their docs). Astro's own tracker treats the content-hashed `_astro/*` filenames as safely long-cacheable — but note this repo's CMS images sit in unhashed `/uploads/*` paths rather than `_astro/`.
7. **CI build-time cost levers documented by Astro**: responsive variants "may increase the build time," and processed-image output is cached in `node_modules/.astro`; the docs recommend preserving that cache between builds. This repo's `.github/workflows/deploy.yml` runs `npm ci` + `astro build` on `ubuntu-latest` and sets up no cache for `node_modules/.astro`; since sharp is a plain npm dependency, it installs normally in the runner (the manual-install note applies to pnpm).
8. **Priority/LCP**: Astro's documented mechanism is the `priority` prop (eager/sync/high-fetchpriority), recommended "ideally only [for] one image per page," typically the LCP element. This site already applies the equivalent native attributes manually on plain `<img>` tags — `fetchpriority="high"` + `loading="eager"` on the first slideshow slide (`src/components/Slideshow.astro`), the project cover (`src/pages/projects/[slug].astro`), and the first three cards (`src/components/ProjectCard.astro`), with `loading="lazy"` elsewhere. Because public/ images do not flow through the Image components, native `<img>` attributes are the documented lever available here.
