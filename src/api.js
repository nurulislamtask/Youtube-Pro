// Free, open APIs only. No keys, no paywalls: everything is unlocked.
// Piped (used by LibreTube) for search/streams, SponsorBlock, LRCLIB for synced lyrics.
const PIPED = "https://pipedapi.kavin.rocks";

export async function search(q, filter = "all") {
  const r = await fetch(`${PIPED}/search?q=${encodeURIComponent(q)}&filter=${filter}`);
  if (!r.ok) throw new Error("Search failed");
  return (await r.json()).items || [];
}

// path looks like "/channel/UC..." (uploaderUrl from search/trending items)
export async function channel(path) {
  const r = await fetch(`${PIPED}${path}`);
  if (!r.ok) throw new Error("Channel failed");
  return r.json();
}

export async function trending(region = "US") {
  const r = await fetch(`${PIPED}/trending?region=${region}`);
  if (!r.ok) throw new Error("Trending failed");
  return r.json();
}

export const videoId = (url = "") => (url.match(/[?&]v=([\w-]{11})/) || [])[1] || url.split("/").pop();

export async function streams(id) {
  const r = await fetch(`${PIPED}/streams/${id}`);
  if (!r.ok) throw new Error("Stream failed");
  return r.json();
}

export async function sponsorSegments(id) {
  try {
    const cats = encodeURIComponent(JSON.stringify(["sponsor", "selfpromo", "intro", "outro", "interaction"]));
    const r = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${id}&categories=${cats}`);
    return r.ok ? r.json() : [];
  } catch {
    return [];
  }
}

export async function lyrics(title, artist) {
  try {
    const r = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
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
