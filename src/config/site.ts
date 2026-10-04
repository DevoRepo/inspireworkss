/**
 * Global brand + contact configuration.
 * Everything here comes from the INSPIREWORKSS Notion page (source of truth).
 */
export const site = {
  name: 'INSPIREWORKSS',
  owner: 'Avani Jangam',
  locale: 'en_US',
  tagline: 'Mechanical, piping & plant engineering — with the how and the why.',
  description:
    'INSPIREWORKSS is the mechanical engineering practice of Avani Jangam — mechanical design & CAD, plant design & piping engineering, pressure vessel and pipe stress analysis, and CAD/CAE training.',
  email: 'inspireeworkss@gmail.com',
  disciplines: ['Mechanical', 'Piping', 'Marine'],
  social: {
    linkedin: { label: 'LinkedIn', handle: 'Avani Jangam', url: 'https://www.linkedin.com/in/avanijangam/' },
    youtube: { label: 'YouTube', handle: '@InspireWorrkss', url: 'https://www.youtube.com/@InspireWorrkss' },
    blog: { label: 'Blog', handle: 'avaniijangam.blogspot.com', url: 'https://avaniijangam.blogspot.com' },
  },
} as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Services', href: '/services/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'Expertise', href: '/expertise/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'Contact', href: '/contact/' },
] as const;

/** Builds a mailto: link with an optional pre-filled subject line. */
export function mailto(subject?: string): string {
  return subject ? `mailto:${site.email}?subject=${encodeURIComponent(subject)}` : `mailto:${site.email}`;
}
