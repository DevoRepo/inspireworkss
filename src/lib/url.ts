/**
 * The site may be served from a sub-path (e.g. GitHub Pages: /inspireworkss/), set via `base`
 * in astro.config.mjs. Every internal link and asset path goes through `url()` so it works both
 * at a domain root (Cloudflare Pages) and under a base path.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes a root-relative path ("/about/") with the configured base path. */
export const url = (path: string): string => `${base}${path}`;
