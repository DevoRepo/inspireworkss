# INSPIREWORKSS — website

Portfolio and services website for **INSPIREWORKSS**, the mechanical engineering practice of **Avani Jangam**.
It is a static [Astro](https://astro.build) site built for **Cloudflare Pages**: no backend, no database, and very little JavaScript.

All content comes from the INSPIREWORKSS Notion page, which is the source of truth.

## Quick start

```sh
npm install
npm run dev       # http://localhost:4321
npm run check     # type + content-schema check
npm run build     # static output in ./dist
npm run preview   # serve ./dist locally
```

Requires Node 22.12 or later.

## Deploying to Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable `NODE_VERSION` | `22` |
| Environment variable `SITE_URL` | your final domain, e.g. `https://example.com` (set once the domain is decided) |

The production domain is **not** hard-coded. Canonical URLs, Open Graph URLs, `sitemap-index.xml` and `robots.txt` all come from `site` in [`astro.config.mjs`](astro.config.mjs), which is resolved in this order:

1. `SITE_URL`, which you set in Cloudflare Pages.
2. `CF_PAGES_URL`, which Cloudflare injects automatically. It is the per-deployment `*.pages.dev` URL.
3. `http://localhost:4321` for local development.

Set `SITE_URL` before launch, even to the `*.pages.dev` address. Without it, canonical URLs point at a deployment-specific preview URL.

Security and caching headers are in [`public/_headers`](public/_headers).

## Temporary preview on GitHub Pages

[`.github/workflows/github-pages-preview.yml`](.github/workflows/github-pages-preview.yml) builds and deploys every push to `main` to `https://<owner>.github.io/<repo>/`. It sets three environment variables:

| Variable | Value | Effect |
|---|---|---|
| `SITE_URL` | `https://<owner>.github.io` | Absolute URLs for canonical tags, Open Graph and the sitemap |
| `BASE_PATH` | `/<repo>` | The site is served from a sub-path. Every internal link goes through `url()` in [`src/lib/url.ts`](src/lib/url.ts) |
| `NOINDEX` | `true` | Adds a `noindex` meta tag and `Disallow: /` in robots.txt, so this temporary copy never shows up in search results |

When the site moves to Cloudflare Pages, leave `BASE_PATH` and `NOINDEX` unset, then delete the workflow or disable GitHub Pages.

## Editing content

Content is kept separate from presentation. Most updates are a single file edit:

| What | Where |
|---|---|
| Brand name, email, social links, navigation | [`src/config/site.ts`](src/config/site.ts) |
| Services (one Markdown file each) | [`src/content/services/`](src/content/services/) |
| Projects (one Markdown file each, plus a cover image) | [`src/content/projects/`](src/content/projects/) |
| Skills (Notion → Expertise) | [`src/content/expertise.json`](src/content/expertise.json) |
| Software and levels (Notion → Tools) | [`src/content/tools.json`](src/content/tools.json) |
| YouTube videos | [`src/content/videos.json`](src/content/videos.json), with the thumbnail saved as `src/assets/videos/<id>.jpg` |
| Experience, education, certifications | [`src/content/credentials.json`](src/content/credentials.json) |

Schemas are in [`src/content.config.ts`](src/content.config.ts). The build fails with a clear message if a field is missing or mistyped.

### Adding a project

1. Put the image in `src/assets/projects/`.
2. Copy an existing file in `src/content/projects/` and edit its frontmatter. `problem`, `approach`, `outcome`, `youtubeId` and `highlights` are optional, and sections without content are not shown.
3. The project page, Projects listing, related-work links, sitemap entry and structured data are all generated automatically.

### Adding experience, education or certifications

Add entries to `src/content/credentials.json`, for example:

```json
[{ "id": "example", "type": "certification", "title": "…", "organisation": "…", "period": "2024", "order": 1 }]
```

An "Experience & qualifications" section then appears on the About page. While the file is empty, the build prints a harmless warning that the collection is empty.

## Copy awaiting owner review

The Notion page lists service titles, but most service pages still contain template placeholder text. The "who it helps / value delivered" lines and the project write-ups were therefore **drafted from Notion facts only**: skills, tools, video titles and what the images show. No clients, numbers or outcomes were invented. Each drafted file is marked `draft: true` in its frontmatter:

- `src/content/services/*.md`: all 8 services
- `src/content/projects/*.md`: all 6 projects

Once Avani has reviewed or rewritten a file, change it to `draft: false`.

These items were left out on purpose because the Notion source does not support them yet:

- Testimonials: the Notion entries are placeholders ("ABC / XYZ / PQR").
- Five web-design "work examples" from a Notion template.
- Experience, education and certifications: none listed.

## Design system: "Drawing Office"

- Each page is styled as a sheet from an engineering drawing set:
  - a title-block page header (`TitleBlock`)
  - section headings marked with cutting-plane lines, "A–A" (`SectionHeading`)
  - animated dimension lines (`DimensionLine`)
  - a faint 8 px / 64 px drafting grid
  - chamfered corners that echo the hexagonal IW mark
- **Light theme is the default.** Dark mode is a separately designed palette (graphite with blueline annotations), toggled from the header's top-right corner. The choice is saved in `localStorage`.
- **Typefaces:** Barlow Condensed for display headings, IBM Plex Sans for body text and IBM Plex Mono for annotations. All three are self-hosted through the Astro Fonts API.
- Design tokens live in [`src/styles/global.css`](src/styles/global.css). Tailwind CSS v4 is used for layout utilities.
- **Motion:** native cross-document view transitions with no JavaScript, plus scroll reveals and the hero line-drawing. Everything is disabled under `prefers-reduced-motion`.

> **Tailwind gotcha:** Astro's component `<style>` blocks are not in a CSS layer, so they override Tailwind utilities on the same element. Put responsive `display` changes for a scoped class inside that component's own media query instead of using `md:hidden`-style utilities.

## Project structure

```text
src/
  assets/        brand logo, project images, video thumbnails (optimised at build)
  components/    UI + brand motif components
  config/        site.ts — brand, contact, navigation
  content/       services, projects, skills, tools, videos, credentials
  layouts/       BaseLayout (head, SEO, theme, header/footer)
  lib/           content helpers, schema.org builders
  pages/         routes (clean URLs, trailing slash)
  styles/        global.css — tokens, base, components, motion
scripts/
  generate-icons.mjs   regenerates favicons from the logo
public/          favicons, manifest, _headers
```
