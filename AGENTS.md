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

- **Live preview:** https://devorepo.github.io/inspireworkss/. Every push to `main` deploys it via `.github/workflows/github-pages-preview.yml`.
- **Repo:** https://github.com/DevoRepo/inspireworkss (branches `main` and `feat/site`).

### Rules
- The source of truth is the INSPIREWORKSS Notion page: https://inspireworkss.notion.site/INSPIREWORKSSS-5afe3987a78a8365b276818574973f05. Never invent clients, stats, testimonials or credentials.
- Never hard-code a domain or root path. Internal links go through `url()` in `src/lib/url.ts`, because the site may be served from a sub-path (`BASE_PATH`). Absolute URLs come from `site` (`SITE_URL` / `CF_PAGES_URL`).
- Light theme is the default. Every new style must work in both themes: use the `--c-*` tokens in `src/styles/global.css` and never hard-code colours.
- Scoped `<style>` in `.astro` files is unlayered, so it overrides Tailwind utilities. Make responsive `display` changes in a component media query instead.
- Don't use gendered pronouns for Avani. Write "Avani Jangam" or rephrase.
- Before committing, run `npm run check` and `npm run build`.

### Where things are (common edits)
| Change | File |
|---|---|
| Email, social links, nav, tagline | `src/config/site.ts` |
| Add or edit a service | `src/content/services/<slug>.md` (schema in `src/content.config.ts`) |
| Add or edit a project | `src/content/projects/<slug>.md` + image in `src/assets/projects/` |
| Skills / software levels | `src/content/expertise.json`, `src/content/tools.json` |
| YouTube videos | `src/content/videos.json` + thumbnail `src/assets/videos/<id>.jpg` |
| Experience / education / certifications | `src/content/credentials.json` (the About section appears automatically) |
| Colours, fonts, spacing, buttons, motion | `src/styles/global.css` |
| Header / footer / theme toggle | `src/components/Header.astro`, `Footer.astro`, `ThemeToggle.astro` |
| Page layouts | `src/pages/*.astro`, `src/pages/services/[slug].astro`, `src/pages/projects/[slug].astro` |
| SEO / structured data | `src/components/SEO.astro`, `src/lib/schema.ts` |

**Reusable components:**
- `TitleBlock`: page header.
- `SectionHeading`: "A–A" section heading.
- `DimensionLine`
- `ServiceIndex`
- `ProjectShowcase` and `ProjectCard`
- `SpecTable`
- `VideoFacade`
- `CTABand`

### Status / open items
- All service and project copy is marked `draft: true`. It was drafted from Notion facts and is awaiting Avani's review.
- Testimonials, experience and education are omitted until real data exists.
- The final domain is not chosen yet. On moving to Cloudflare Pages, set `SITE_URL`, leave `BASE_PATH` and `NOINDEX` unset, and remove the GitHub Pages workflow.
