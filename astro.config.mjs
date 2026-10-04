// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * The production domain has not been decided yet, so it is never hard-coded.
 * - SITE_URL: set this in Cloudflare Pages once the domain is chosen (e.g. https://example.com).
 * - CF_PAGES_URL: injected automatically by Cloudflare Pages builds (fallback).
 * - localhost: local development fallback.
 * Canonical URLs, Open Graph URLs, the sitemap and robots.txt all derive from this value.
 */
const site = process.env.SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:4321';

/**
 * Sub-path the site is served from. '/' for a domain root (Cloudflare Pages);
 * '/inspireworkss' for the temporary GitHub Pages preview. Links use src/lib/url.ts.
 */
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  env: {
    schema: {
      /** true = temporary/preview deployment: noindex meta + "Disallow: /" in robots.txt. */
      NOINDEX: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      name: 'Barlow Condensed',
      cssVariable: '--font-barlow-condensed',
      provider: fontProviders.fontsource(),
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      provider: fontProviders.fontsource(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
    },
  ],
});
