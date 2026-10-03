import type { ImageMetadata } from 'astro';

/**
 * CMS uploads live in src/uploads so Astro processes them at build time, but
 * content stores their public path (`/uploads/x.webp`) — the format Sveltia
 * writes via `public_folder`. This maps that path back to the module metadata
 * Astro needs to generate responsive variants. Throws on unknown paths so a
 * missing upload fails the build loudly, not silently at render time.
 */
const uploads = import.meta.glob<{ default: ImageMetadata }>(
  '/src/uploads/**/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

export function resolveUpload(src: string): ImageMetadata {
  const mod = uploads[`/src${src}`];
  if (!mod) throw new Error(`Upload not found: ${src} — expected a file at src${src}`);
  return mod.default;
}

export function isPortrait({ width, height }: ImageMetadata): boolean {
  return (height ?? 0) > (width ?? 0);
}
