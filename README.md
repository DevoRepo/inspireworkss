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

## Deploying to Cloudflare

The site is hosted on **Cloudflare Pages, which now runs on Cloudflare Workers** as static assets. There is no server code and no adapter.

**Live:** https://inspireworkss.inspireworkss.workers.dev

```sh
npm run deploy               # type-check → fetch YouTube videos → build → upload to Cloudflare
npm run preview:cloudflare   # build, then serve locally through Cloudflare's runtime (wrangler dev)
```

### Automatic deploys (GitHub Actions)

[`.github/workflows/deploy-cloudflare.yml`](.github/workflows/deploy-cloudflare.yml) runs `npm run deploy`:
- on every push to `main`;
- **daily at 02:30 UTC**, so new YouTube videos and view counts appear automatically;
- whenever you start it from **Actions → Deploy to Cloudflare → Run workflow**.

It uses two repository secrets: `CLOUDFLARE_API_TOKEN` (the "Edit Cloudflare Workers" token) and `YOUTUBE_API_KEY`. The account ID is in `wrangler.jsonc`.

GitHub pauses scheduled workflows after 60 days with no repository activity. If that happens, re-enable the workflow from the Actions tab.

### Manual deploys

Manual deploys from your own machine need a one-time `npx wrangler login`. To use the YouTube API key locally, copy `.env.example` to `.env`, which git ignores, and fill it in. The Cloudflare settings are in [`wrangler.jsonc`](wrangler.jsonc):
- project name `inspireworkss`
- assets served from `./dist`
- `dist/404.html` for unknown URLs
- automatic trailing slashes

The production domain is **not** hard-coded into the site. Canonical URLs, Open Graph URLs, `sitemap-index.xml` and `robots.txt` all come from `site` in [`astro.config.mjs`](astro.config.mjs). It is resolved in this order:

1. `SITE_URL`. The `deploy` script defaults it to the `workers.dev` address above.
2. `CF_PAGES_URL`, which Cloudflare's Git-connected builds inject automatically.
3. `http://localhost:4321` for local development.

### When the domain is decided

1. In the Cloudflare dashboard, go to **Workers & Pages → inspireworkss → Settings → Domains & Routes → Add → Custom domain**. The domain must use Cloudflare DNS.
2. Change the default URL in the `deploy` script in `package.json` to the new domain, or run `SITE_URL=https://your-domain.com npm run deploy`.
3. Optionally turn off the `workers.dev` route in the same settings page, so only the real domain serves the site.

Security and caching headers are in [`public/_headers`](public/_headers).

## Optional build settings

These environment variables are not used for the live site. They're available if you ever need a test copy:

| Variable | Effect |
|---|---|
| `BASE_PATH` | Serves the site from a sub-path, e.g. `/preview`. Every internal link goes through `url()` in [`src/lib/url.ts`](src/lib/url.ts). |
| `NOINDEX=true` | Adds a `noindex` meta tag and `Disallow: /` in robots.txt, so a test copy never appears in search results. |

## Editing content

Content is kept separate from presentation. Most updates are a single file edit:

| What | Where |
|---|---|
| Brand name, email, social links, navigation | [`src/config/site.ts`](src/config/site.ts) |
| Services (one Markdown file each) | [`src/content/services/`](src/content/services/) |
| Projects (one Markdown file each, plus a cover image) | [`src/content/projects/`](src/content/projects/) |
| Skills | [`src/content/expertise.json`](src/content/expertise.json). There are no levels; the "Applied in" links come from each service's `skills` list |
| Software, with a "used for" line | [`src/content/tools.json`](src/content/tools.json) |
| Resources page videos | Automatic, see [YouTube videos on Resources](#youtube-videos-on-resources) |
| Homepage "Learn" videos | [`src/content/videos.json`](src/content/videos.json), with the thumbnail saved as `src/assets/videos/<id>.jpg` |
| Experience, education, certifications | [`src/content/credentials.json`](src/content/credentials.json) |

Schemas are in [`src/content.config.ts`](src/content.config.ts). The build fails with a clear message if a field is missing or mistyped.

### YouTube videos on Resources

The Resources page lists the channel's **long-form videos automatically**: title, summary, "what you'll learn" topics, views, date and thumbnail. Shorts are excluded. Videos are **sorted by views (most watched first)**, **5 per page** (`/resources/`, `/resources/2/`, …).

- [`scripts/fetch-youtube.mjs`](scripts/fetch-youtube.mjs) runs before every `npm run build` (the `prebuild` script). Run it on its own with `npm run youtube`.
- It writes `src/content/youtube.json`, `src/content/youtube-meta.json` and thumbnails to `src/assets/youtube/`. These are a committed snapshot, so builds still work if YouTube can't be reached.
- Shorts are excluded by reading YouTube's long-form-only playlist (`UULF…`).
- Channel ID and page size are in [`src/config/youtube.json`](src/config/youtube.json).
- The Cloudflare deploy workflow rebuilds **daily**, so new videos and view counts appear automatically.

**With `YOUTUBE_API_KEY` set (current setup)**, the script uses the YouTube Data API v3. It reads every long-form video, with exact views and lengths. The key is a GitHub repository secret, plus `.env` for local builds.

**Without a key**, it falls back to the public feed: the latest 15 long-form videos, with older ones kept from the committed snapshot.

To replace the key:
1. In [Google Cloud Console](https://console.cloud.google.com/), open **APIs & Services → Credentials**.
2. Create or regenerate the key. Keep it restricted to YouTube Data API v3.
3. Update the GitHub secret `YOUTUBE_API_KEY`, and your local `.env` if you use one.

The free quota is 10,000 units a day; one build uses only a few units.

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

- The drawing-office identity is kept light, so it never gets in the way of reading:
  - every page header is built like the home hero: heading on the left, a visual on the right and a strip of key facts (`TitleBlock`)
  - real, to-scale technical drawings as header visuals: a weld-neck flange (ASME B16.5), a GD&T plate (ASME Y14.5) and a sheet-metal flat pattern (`src/components/drawings/`)
  - section headings with a mono caption and a red tick (`SectionHeading`)
  - a faint 8 px / 64 px drafting grid behind headers only
- **Colour blocks (DESIGN.md):** one rounded panel per page carries a story section (`.surface-tint`, `.surface-blush`); the closing call to action is an inset graphite block.
- **Shapes (DESIGN.md):** pill buttons and chips, hairline cards with 16 px corners (`.card`), no shadows. Cards sit apart with a gap; they are never joined into box grids.
- **Light theme is the default.** Dark mode is a separately designed palette (graphite with blueline annotations), toggled from the header's top-right corner. The choice is saved in `localStorage`.
- **Typefaces:** Geist (variable) for everything: headings, body, buttons and labels. Hierarchy comes from size, weight and tracking, never from switching font. Geist Mono is used only for small uppercase section captions and drawing annotations, never for text people read. Both are self-hosted through the Astro Fonts API.
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
