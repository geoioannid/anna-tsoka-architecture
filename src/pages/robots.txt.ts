import type { APIRoute } from 'astro';

/**
 * robots.txt is generated so the Sitemap URL always matches the deployed
 * location: it includes Astro's base path while the site lives at the GitHub
 * Pages project URL and drops it automatically once base becomes '/' at the
 * custom domain. (Pattern from the @astrojs/sitemap docs.)
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://annatsoka.com');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, origin).href;

  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemap}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
