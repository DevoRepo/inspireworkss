## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project notes (INSPIREWORKSS)

Static Astro 7 site for INSPIREWORKSS, the mechanical engineering practice of Avani Jangam. It uses Tailwind v4 for layout and is intended for Cloudflare Pages.

- **Production:** https://inspireworkss.inspireworkss.workers.dev (Cloudflare Pages on Workers, static assets). `.github/workflows/deploy-cloudflare.yml` runs `npm run deploy` on every push to `main`, daily and on demand. It uses the secrets `CLOUDFLARE_API_TOKEN` and `YOUTUBE_API_KEY`. Config is in `wrangler.jsonc`.
- **Repo:** https://github.com/DevoRepo/inspireworkss (branches `main` and `feat/site`).

### Rules
- The source of truth is the INSPIREWORKSS Notion page: https://inspireworkss.notion.site/INSPIREWORKSSS-5afe3987a78a8365b276818574973f05. Never invent clients, stats, testimonials or credentials.
- Never hard-code a domain or root path. Internal links go through `url()` in `src/lib/url.ts`, because the site can be built for a sub-path (`BASE_PATH`, unused in production). Absolute URLs come from `site` (`SITE_URL` / `CF_PAGES_URL`).
- Typography follows DESIGN.md: Geist for all text, in sentence case. Use Geist Mono only for the `.eyebrow` section caption and drawing annotations. Small sub-labels use `.label` (sans). Never use spaced-out uppercase mono for labels, tables, stats or buttons. Boxes are `.card` (hairline, rounded, separated by a gap), not joined `gap-px` grids.
- At most one tinted or blush DESIGN.md colour block per page, plus the graphite `CTABand`: `.surface` with `.surface-tint` (pale steel), `.surface-blush` (soft red) or `.surface-sheet`. Don't name a class `.block`; it clashes with Tailwind's `block` utility.
- Copy reads like a person wrote it: plain sentences, no em-dash slogans, no "not X but Y" lines, no drafting gimmicks (Fig., Rev, Drawn by, Sheet n/n). YAML front matter that contains `: ` must be quoted.
- Light theme is the default. Every new style must work in both themes: use the `--c-*` tokens in `src/styles/global.css` and never hard-code colours.
- Scoped `<style>` in `.astro` files is unlayered, so it overrides Tailwind utilities. Make responsive `display` changes in a component media query instead.
- Don't use gendered pronouns for Avani. Write "Avani Jangam" or rephrase.
- Before committing, run `npm run check` and `npm run build`. `npm run build` also refreshes the YouTube snapshot, so commit those generated files too.
- The Projects section will get a different design later; the user will specify it. Don't couple it to the Resources video feed.

### Where things are (common edits)
| Change | File |
|---|---|
| Email, social links, nav, tagline | `src/config/site.ts` |
| Add or edit a service | `src/content/services/<slug>.md` (schema in `src/content.config.ts`) |
| Add or edit a project | `src/content/projects/<slug>.md` + image in `src/assets/projects/` |
| Skills / software | `src/content/expertise.json` (skill, category, note), `src/content/tools.json` (name, use, group). **No self-rated levels**: every skill is shown as professional, with "Applied in" links derived from the services that reference it. |
| Resources page videos | **Automatic.** `scripts/fetch-youtube.mjs` runs as `prebuild`. It writes `src/content/youtube.json` + `src/assets/youtube/`, long-form only, sorted by views, 5 per page (`src/config/youtube.json`). Never edit the generated files by hand. |
| Homepage "Learn" videos | `src/content/videos.json` + thumbnail `src/assets/videos/<id>.jpg` |
| Experience / education / certifications | `src/content/credentials.json` (the About section appears automatically) |
| Colours, fonts, spacing, buttons, motion | `src/styles/global.css` |
| Header / footer / theme toggle | `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro` |
| Page layouts | `src/pages/*.astro`, `src/pages/services/[slug].astro`, `src/pages/projects/[slug].astro` |
| SEO / structured data | `src/components/SEO.astro`, `src/lib/schema.ts` |

**Reusable components:**
- `TitleBlock`: inner-page header, built like the home hero. Put a visual in `slot="aside"` (a drawing, image or card) and key facts in `meta` (shown as a strip along the bottom).
- `drawings/FlangeDrawing`, `drawings/GdtDrawing`, `drawings/FlatPatternDrawing`: to-scale technical drawings for page headers (Services, Expertise, Projects). They share the `.drawing` styles in `global.css`, and only one goes on a page (marker and hatch ids are fixed).
- `SectionHeading`: mono eyebrow with a red tick, then the heading.
- `DimensionLine` (home only)
- `ServiceIndex`
- `ProjectShowcase` and `ProjectCard`
- `SpecTable`
- `VideoFacade`
- `CTABand`: closing call to action, an inset graphite colour block.

### Status / open items
- All service and project copy is marked `draft: true`. It was drafted from Notion facts and is awaiting Avani's review.
- Testimonials, experience and education are omitted until real data exists.
- The final domain is not chosen yet. When it is, add it as a custom domain in Cloudflare and update the `SITE_URL` default in the `deploy` script. Never set `BASE_PATH` or `NOINDEX` for Cloudflare.
- YouTube API key: configured as a GitHub secret. For local builds, put it in `.env` (git-ignored; see `.env.example`).
