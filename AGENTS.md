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

- Content source of truth: the INSPIREWORKSS Notion page. Never invent clients, stats, testimonials or credentials.
- Content lives in `src/content/` + `src/config/site.ts`; see README for the drafted-copy review list.
- Scoped `<style>` in `.astro` files is unlayered and overrides Tailwind utilities — use component media queries for responsive display changes.
- Never hard-code the production domain; `site` comes from `SITE_URL` / `CF_PAGES_URL`.
