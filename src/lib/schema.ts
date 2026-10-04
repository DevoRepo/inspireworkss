import { url } from './url';
import { site } from '../config/site';

/** schema.org helpers. All URLs are absolute and derived from Astro's configured `site`. */

export type JsonLd = Record<string, unknown>;

export const ids = (origin: URL) => ({
  org: new URL(url('/#organization'), origin).href,
  person: new URL(url('/#avani-jangam'), origin).href,
  website: new URL(url('/#website'), origin).href,
});

export function baseGraph(origin: URL, logoUrl: string, knowsAbout: string[]): JsonLd[] {
  const id = ids(origin);
  const sameAs = Object.values(site.social).map((s) => s.url);
  return [
    {
      '@type': 'Organization',
      '@id': id.org,
      name: site.name,
      url: new URL(url('/'), origin).href,
      logo: logoUrl,
      email: `mailto:${site.email}`,
      description: site.description,
      founder: { '@id': id.person },
      sameAs,
    },
    {
      '@type': 'Person',
      '@id': id.person,
      name: site.owner,
      jobTitle: 'Mechanical Engineer',
      url: new URL(url('/about/'), origin).href,
      worksFor: { '@id': id.org },
      knowsAbout,
      sameAs: [site.social.linkedin.url, site.social.youtube.url, site.social.blog.url],
    },
    {
      '@type': 'WebSite',
      '@id': id.website,
      name: site.name,
      url: new URL(url('/'), origin).href,
      publisher: { '@id': id.org },
      inLanguage: 'en',
    },
  ];
}

export function breadcrumbs(origin: URL, trail: { name: string; href: string }[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(url(item.href), origin).href,
    })),
  };
}
