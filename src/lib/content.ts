import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { expertiseCategories } from '../content.config';

export type Service = CollectionEntry<'services'>;
export type Project = CollectionEntry<'projects'>;
export type Skill = CollectionEntry<'expertise'>;
export type Tool = CollectionEntry<'tools'>;
export type Video = CollectionEntry<'videos'>;

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function getServices(): Promise<Service[]> {
  return (await getCollection('services')).sort(byOrder);
}

export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects')).sort(byOrder);
}

export async function getVideos(): Promise<Video[]> {
  return (await getCollection('videos')).sort(byOrder);
}

const levelRank: Record<string, number> = { Expert: 0, Advanced: 0, Intermediate: 1 };
const rank = (level?: string) => (level ? (levelRank[level] ?? 2) : 2);

/** Display order for software groups. */
export const toolGroups = ['CAD — 2D & 3D', 'Plant design & review', 'Analysis', 'Automation & productivity'];

/** Skills ordered by category (as defined in the content config), then level, then name. */
export async function getSkills(): Promise<Skill[]> {
  return (await getCollection('expertise')).sort(
    (a, b) =>
      expertiseCategories.indexOf(a.data.category) - expertiseCategories.indexOf(b.data.category) ||
      rank(a.data.level) - rank(b.data.level) ||
      a.data.skill.localeCompare(b.data.skill),
  );
}

/** Tools ordered by group, then level (Expert first), then name. */
export async function getTools(): Promise<Tool[]> {
  const groupIndex = (g: string) => (toolGroups.includes(g) ? toolGroups.indexOf(g) : toolGroups.length);
  return (await getCollection('tools')).sort(
    (a, b) =>
      groupIndex(a.data.group) - groupIndex(b.data.group) ||
      rank(a.data.level) - rank(b.data.level) ||
      a.data.name.localeCompare(b.data.name),
  );
}

export async function getCredentials() {
  return (await getCollection('credentials')).sort((a, b) => a.data.order - b.data.order);
}

/** Resolves a list of `reference()` values into full entries (keeps source order). */
export async function resolveTools(refs: { collection: 'tools'; id: string }[]): Promise<Tool[]> {
  return refs.length ? getEntries(refs) : [];
}

export async function resolveSkills(refs: { collection: 'expertise'; id: string }[]): Promise<Skill[]> {
  return refs.length ? getEntries(refs) : [];
}

/** Groups items by a key while preserving first-seen order. */
export function groupBy<T, K extends string>(items: T[], key: (item: T) => K): [K, T[]][] {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return [...map.entries()];
}

/** Two-digit drawing-style index: 1 → "01". */
export const pad = (n: number) => String(n).padStart(2, '0');

const thumbnails = import.meta.glob<{ default: ImageMetadata }>('/src/assets/videos/*.jpg', { eager: true });

/** Local, optimisable thumbnail for a YouTube video id (stored in src/assets/videos/<id>.jpg). */
export function videoThumbnail(id: string): ImageMetadata {
  const mod = thumbnails[`/src/assets/videos/${id}.jpg`];
  if (!mod) throw new Error(`Missing thumbnail src/assets/videos/${id}.jpg`);
  return mod.default;
}

export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
