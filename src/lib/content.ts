import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { expertiseCategories } from '../content.config';
import toolsData from '../content/tools.json';

export type Service = CollectionEntry<'services'>;
export type Project = CollectionEntry<'projects'>;
export type Skill = CollectionEntry<'expertise'>;
export type Tool = CollectionEntry<'tools'>;
export type Video = CollectionEntry<'videos'>;
export type YouTubeVideo = CollectionEntry<'youtube'>;

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

const toolOrder = toolsData.map((t) => t.id);

/** Display order for software groups. */
export const toolGroups = ['CAD — 2D & 3D', 'Plant design & review', 'Analysis', 'Automation & productivity'];

/** Skills ordered by category (as defined in the content config), then name. */
export async function getSkills(): Promise<Skill[]> {
  return (await getCollection('expertise')).sort(
    (a, b) =>
      expertiseCategories.indexOf(a.data.category) - expertiseCategories.indexOf(b.data.category) ||
      a.data.skill.localeCompare(b.data.skill),
  );
}

/** Tools ordered by group (see toolGroups), keeping the order of src/content/tools.json within a group. */
/** Long-form channel videos, most viewed first (newest first when views are equal). */
export async function getYouTubeVideos(): Promise<YouTubeVideo[]> {
  return (await getCollection('youtube')).sort(
    (a, b) => b.data.views - a.data.views || b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

export async function getTools(): Promise<Tool[]> {
  const groupIndex = (g: string) => (toolGroups.includes(g) ? toolGroups.indexOf(g) : toolGroups.length);
  return (await getCollection('tools')).sort(
    (a, b) =>
      groupIndex(a.data.group) - groupIndex(b.data.group) || toolOrder.indexOf(a.id) - toolOrder.indexOf(b.id),
  );
}

/** Groups that hold engineering (CAD/CAE) software, as opposed to general productivity tools. */
export const isEngineeringTool = (t: Tool) => t.data.group !== 'Automation & productivity';

/**
 * Where each skill is applied: skill id → services that list it (from src/content/services/*.md).
 * Replaces self-rated levels with evidence of use.
 */
export async function getSkillApplications(): Promise<Map<string, Service[]>> {
  const map = new Map<string, Service[]>();
  for (const service of await getServices()) {
    for (const ref of service.data.skills) map.set(ref.id, [...(map.get(ref.id) ?? []), service]);
  }
  return map;
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

const thumbnails = import.meta.glob<{ default: ImageMetadata }>(['/src/assets/videos/*.jpg', '/src/assets/youtube/*.jpg'], { eager: true });

/**
 * Local, optimisable thumbnail for a YouTube video id.
 * Thumbnails fetched from the channel (src/assets/youtube/, refreshed every build) take priority,
 * so a changed thumbnail on YouTube shows up on the site; src/assets/videos/ is the hand-kept fallback.
 */
export function videoThumbnail(id: string): ImageMetadata {
  const mod = thumbnails[`/src/assets/youtube/${id}.jpg`] ?? thumbnails[`/src/assets/videos/${id}.jpg`];
  if (!mod) throw new Error(`Missing thumbnail for video ${id}`);
  return mod.default;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatViews = (n: number) => `${compact.format(n)} ${n === 1 ? 'view' : 'views'}`;
export const formatDate = (d: Date) => dateFormat.format(d);

/** 754 → "12:34", 3723 → "1:02:03". */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
