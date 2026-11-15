// Free, open APIs only. No keys, no paywalls: everything is unlocked.
// Piped (used by LibreTube) for search/streams, SponsorBlock, LRCLIB for synced lyrics.
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// Inside the installed app, requests go through Rust (no browser CORS limits).
const inTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;
export const hfetch = (url, opts) => (inTauri ? tauriFetch(url, opts) : fetch(url, opts));

const FALLBACK = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.private.coffee",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.reallyaweso.me",
  "https://pipedapi.darkness.services",
];

let good = null; // last working server
let dynamic = null; // servers fetched from the public instance list

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

async function servers() {
  if (!dynamic) {
    try {
      const r = await withTimeout(hfetch("https://piped-instances.kavin.rocks"), 6000);
      dynamic = (await r.json()).map((i) => i.api_url).filter(Boolean).slice(0, 8);
    } catch {
      dynamic = [];
    }
  }
  return [...new Set([good, ...FALLBACK, ...dynamic].filter(Boolean))];
}

// Try servers one by one until one answers. Remembers the one that works.
async function piped(path) {
  const list = good ? [good, ...FALLBACK] : FALLBACK;
  const tryAll = async (urls) => {
    for (const base of urls) {
      try {
        const r = await withTimeout(hfetch(base + path), 9000);
        if (r.ok) {
          const data = await r.json();
          good = base;
          return data;
        }
      } catch {}
    }
    return null;
  };
  let data = await tryAll([...new Set(list)]);
  if (data === null) data = await tryAll(await servers());
  if (data === null) throw new Error("No server reachable");
  return data;
}

export async function search(q, filter = "all") {
  return (await piped(`/search?q=${encodeURIComponent(q)}&filter=${filter}`)).items || [];
}

// path looks like "/channel/UC..." (uploaderUrl from search/trending items)
export async function channel(path) {
  return piped(path);
}

export async function trending(region = "US") {
  return piped(`/trending?region=${region}`);
}

export const videoId = (url = "") => (url.match(/[?&]v=([\w-]{11})/) || [])[1] || url.split("/").pop();

export async function streams(id) {
  return piped(`/streams/${id}`);
}

export async function sponsorSegments(id) {
  try {
    const cats = encodeURIComponent(JSON.stringify(["sponsor", "selfpromo", "intro", "outro", "interaction"]));
    const r = await hfetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${id}&categories=${cats}`);
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

export async function lyrics(title, artist) {
  try {
    const r = await hfetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
    const list = await r.json();
    const hit = list.find((x) => x.syncedLyrics) || list[0];
    if (!hit) return [];
    if (hit.syncedLyrics) {
      return hit.syncedLyrics.split("\n").map((l) => {
        const m = l.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        return m ? { t: +m[1] * 60 + +m[2], text: m[3].trim() } : null;
      }).filter(Boolean);
    }
    return (hit.plainLyrics || "").split("\n").map((text, i) => ({ t: i * 4, text }));
  } catch {
    return [];
  }
}
