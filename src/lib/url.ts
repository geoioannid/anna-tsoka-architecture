/**
 * Prefixes a root-relative path with Astro's base so assets and links work
 * both at the GitHub Pages project path and at a custom domain root.
 * withBase('/uploads/x.jpg') → '/anna-tsoka-architecture/uploads/x.jpg' today,
 * '/uploads/x.jpg' once base is '/'.
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
