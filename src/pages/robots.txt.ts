import type { APIRoute } from 'astro';
import { NOINDEX } from 'astro:env/server';
import { url } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(url('/sitemap-index.xml'), site);
  const rules = NOINDEX ? 'Disallow: /' : 'Allow: /';
  return new Response(`User-agent: *\n${rules}\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
