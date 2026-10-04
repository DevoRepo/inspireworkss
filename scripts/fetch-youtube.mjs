// Fetches the INSPIREWORKSS channel's long-form videos (Shorts excluded) for the Resources page.
//
// Runs automatically before every `npm run build` (the "prebuild" script), or manually: `npm run youtube`.
//
// Two modes:
//  • YOUTUBE_API_KEY set → YouTube Data API: every long-form video, exact views + durations.
//  • no key            → public RSS feed of the channel's long-form playlist (latest 15 videos).
//                         Older videos already in the snapshot are kept, so the archive keeps growing.
//
// Shorts are excluded by reading YouTube's long-form-only uploads playlist ("UULF" + channel id).
//
// Output (committed as a fallback snapshot, refreshed on every build):
//   src/content/youtube.json        — videos, sorted by views (most popular first)
//   src/content/youtube-meta.json   — when/how the snapshot was made
//   src/assets/youtube/<id>.jpg     — thumbnails (letterbox bars removed), optimised by Astro at build
//
// If YouTube cannot be reached, the existing snapshot is kept and the build continues.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const CONFIG = JSON.parse(await readFile(new URL('../src/config/youtube.json', import.meta.url), 'utf8'));
const OUT_JSON = new URL('../src/content/youtube.json', import.meta.url);
const OUT_META = new URL('../src/content/youtube-meta.json', import.meta.url);
const THUMB_DIR = new URL('../src/assets/youtube/', import.meta.url);

const API_KEY = process.env.YOUTUBE_API_KEY?.trim();
const channelSuffix = CONFIG.channelId.replace(/^UC/, '');
const LONG_FORM_PLAYLIST = `UULF${channelSuffix}`;
const ALL_UPLOADS_PLAYLIST = `UU${channelSuffix}`;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; inspireworkss-site-build)' };

const log = (...a) => console.log('[youtube]', ...a);

// ─────────────────────────── helpers ───────────────────────────

async function exists(url) {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

async function readSnapshot() {
  try {
    return JSON.parse(await readFile(OUT_JSON, 'utf8'));
  } catch {
    return [];
  }
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;

/** Removes emoji and tidies whitespace (used for titles and summaries). */
const tidy = (s = '') => s.replace(EMOJI, '').replace(/\s+([!?.,:;])/g, '$1').replace(/\s+/g, ' ').trim();

const CTA = /\b(subscribe|comment|like|share|hashtags?|follow|let me know|drop your|what should i model|notification|bell)\b/i;
const BULLET = /^\s*[•▪◦‣\-–]\s*/;

/**
 * Turns a raw YouTube description into a short summary + a list of "what you'll learn" topics.
 * Headings, calls-to-action, links and hashtags are skipped.
 */
function parseDescription(description = '') {
  const paragraphs = description.split(/\n\s*\n/).map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean));
  const prose = [];
  const topics = [];

  for (const lines of paragraphs) {
    const bullets = lines.filter((l) => BULLET.test(l));
    if (bullets.length && !topics.length) topics.push(...bullets.map((l) => tidy(l.replace(BULLET, ''))).filter(Boolean).slice(0, 6));

    const text = tidy(
      lines
        .filter((l) => !BULLET.test(l))
        .join(' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/(^|\s)[#@][\p{L}\p{N}_]+/gu, ' '),
    );
    const isHeading = text.endsWith(':') && text.length < 60;
    if (!text || isHeading || CTA.test(text) || text.length < 25) continue;
    // A sentence of real prose. Skip short audience lists ("Mechanical Engineering Students CAD Designers …").
    if (lines.length > 2 && lines.every((l) => l.length < 40 && !/[.!?]$/.test(l))) continue;
    prose.push(text.replace(/:$/, '.'));
  }

  let summary = '';
  for (const p of prose) {
    if (summary.length >= 110) break;
    summary = summary ? `${summary} ${p}` : p;
  }
  if (summary.length > 220) summary = summary.slice(0, 220).replace(/\s+\S*$/, '').replace(/[,;:]$/, '') + '…';
  return { summary, topics };
}

/** ISO-8601 duration (PT1H2M3S) → seconds. */
function isoToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '');
  return m ? (+(m[1] ?? 0)) * 3600 + (+(m[2] ?? 0)) * 60 + +(m[3] ?? 0) : null;
}

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw Object.assign(new Error(`${res.status} ${url.replace(/key=[^&]+/, 'key=***')}`), { status: res.status });
  return res.json();
}

/** true if YouTube serves the id as a Short (the /shorts/ URL does not redirect). */
async function isShort(id) {
  const res = await fetch(`https://www.youtube.com/shorts/${id}`, { headers: UA, redirect: 'manual' });
  return res.status === 200;
}

/** true if the video is still public (used to drop deleted/private videos kept from older snapshots). */
async function isPublic(id) {
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`, { headers: UA });
  return res.ok;
}

// ─────────────────────────── sources ───────────────────────────

async function fromApi() {
  const listPlaylist = async (playlistId) => {
    const ids = [];
    let pageToken = '';
    do {
      const data = await getJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`,
      );
      ids.push(...data.items.map((i) => i.contentDetails.videoId));
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);
    return ids;
  };

  let ids;
  try {
    ids = await listPlaylist(LONG_FORM_PLAYLIST);
  } catch (e) {
    if (e.status !== 404) throw e;
    log('long-form playlist unavailable — falling back to all uploads + Shorts check');
    ids = [];
    for (const id of await listPlaylist(ALL_UPLOADS_PLAYLIST)) if (!(await isShort(id))) ids.push(id);
  }

  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50).join(',');
    const data = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${batch}&key=${API_KEY}`);
    for (const v of data.items) {
      if (v.status?.privacyStatus !== 'public' || v.snippet.liveBroadcastContent !== 'none') continue;
      videos.push({
        id: v.id,
        title: tidy(v.snippet.title),
        ...parseDescription(v.snippet.description),
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics.viewCount ?? 0),
        duration: isoToSeconds(v.contentDetails.duration),
      });
    }
  }
  return videos;
}

async function fromRss(previous) {
  const feed = async (playlistId) => {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`, { headers: UA });
    if (!res.ok) throw Object.assign(new Error(`RSS ${res.status}`), { status: res.status });
    return res.text();
  };

  let xml;
  let needsShortsCheck = false;
  try {
    xml = await feed(LONG_FORM_PLAYLIST);
  } catch (e) {
    if (e.status !== 404) throw e;
    log('long-form feed unavailable — falling back to all uploads + Shorts check');
    xml = await feed(ALL_UPLOADS_PLAYLIST);
    needsShortsCheck = true;
  }

  const fresh = [];
  for (const entry of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    const pick = (re) => re.exec(entry)?.[1] ?? '';
    const id = pick(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const link = pick(/<link rel="alternate" href="(.*?)"/);
    if (!id || link.includes('/shorts/')) continue;
    if (needsShortsCheck && (await isShort(id))) continue;
    fresh.push({
      id,
      title: tidy(decode(pick(/<media:title>([\s\S]*?)<\/media:title>/) || pick(/<title>([\s\S]*?)<\/title>/))),
      ...parseDescription(decode(pick(/<media:description>([\s\S]*?)<\/media:description>/))),
      publishedAt: pick(/<published>(.*?)<\/published>/),
      views: Number(pick(/views="(\d+)"/) || 0),
      duration: null,
    });
  }

  // Keep older videos from the previous snapshot that have dropped out of the 15-item feed.
  const freshIds = new Set(fresh.map((v) => v.id));
  const kept = [];
  for (const old of previous) {
    if (freshIds.has(old.id)) continue;
    if (await isPublic(old.id)) kept.push(old);
  }
  return [...fresh, ...kept];
}

// ─────────────────────────── thumbnails ───────────────────────────

/** Downloads the best available thumbnail and trims black letterbox / pillarbox bars. */
async function saveThumbnail(id) {
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${name}.jpg`, { headers: UA });
    if (!res.ok) continue;
    const input = Buffer.from(await res.arrayBuffer());
    const { width, height } = await sharp(input).metadata();

    let image = sharp(input);
    try {
      const { data, info } = await sharp(input).trim({ background: '#000000', threshold: 28 }).toBuffer({ resolveWithObject: true });
      const ratio = info.width / info.height;
      // Accept the trim only if it removed bars and left a sensible video-shaped frame.
      if (info.width * info.height >= width * height * 0.5 && ratio >= 1.25 && ratio <= 1.9 && (info.width < width || info.height < height)) {
        image = sharp(data);
      }
    } catch {
      /* nothing to trim */
    }

    await image.resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(fileURLToPath(new URL(`${id}.jpg`, THUMB_DIR)));
    return true;
  }
  return false;
}

// ─────────────────────────── main ───────────────────────────

const previous = await readSnapshot();

try {
  const source = API_KEY ? 'api' : 'rss';
  log(`fetching long-form videos via ${source === 'api' ? 'YouTube Data API' : 'public RSS feed'}…`);
  let videos = source === 'api' ? await fromApi() : await fromRss(previous);

  await mkdir(THUMB_DIR, { recursive: true });
  const withThumbs = [];
  for (const v of videos) {
    const saved = await saveThumbnail(v.id).catch((e) => (log(`thumbnail ${v.id}: ${e.message}`), false));
    if (saved || (await exists(new URL(`${v.id}.jpg`, THUMB_DIR)))) withThumbs.push(v);
    else log(`skipping ${v.id} (no thumbnail available)`);
  }
  // Never replace a good snapshot with an empty one because of a temporary failure.
  if (videos.length > 0 && withThumbs.length === 0) throw new Error('no thumbnails could be saved');

  // Most popular first; newest first when views are equal.
  videos = withThumbs.sort((a, b) => b.views - a.views || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  await writeFile(OUT_JSON, JSON.stringify(videos, null, 2) + '\n');
  await writeFile(
    OUT_META,
    JSON.stringify({ fetchedAt: new Date().toISOString(), source, channelId: CONFIG.channelId, count: videos.length }, null, 2) + '\n',
  );
  log(`saved ${videos.length} long-form videos (Shorts excluded), sorted by views`);
} catch (error) {
  log(`could not refresh videos (${error.message}) — keeping the existing snapshot of ${previous.length} videos`);
  if (!(await exists(OUT_JSON))) await writeFile(OUT_JSON, '[]\n');
  if (!(await exists(OUT_META))) {
    await writeFile(OUT_META, JSON.stringify({ fetchedAt: null, source: 'none', channelId: CONFIG.channelId, count: 0 }, null, 2) + '\n');
  }
}
