// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// NOTE: `base` must match where the site is served. It is the GitHub Pages
// project path today; when the custom domain goes live, set it back to '/'
// (see SETUP.md, step 3).
export default defineConfig({
  site: 'https://annatsoka.com',
  base: '/anna-tsoka-architecture',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
