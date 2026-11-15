// Small local storage helpers: settings and lists (history, likes, watch later, saved, subscriptions).
const rd = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? d;
  } catch {
    return d;
  }
};
const wr = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

const DEFAULTS = { sponsorblock: true, autoplay: true, region: "US", server: "", hideShorts: false, incognito: false, profileName: "You" };
export const getSettings = () => ({ ...DEFAULTS, ...rd("settings", {}) });
export const setSettings = (patch) => {
  const s = { ...getSettings(), ...patch };
  wr("settings", s);
  return s;
};

export const getList = (k) => rd(k, []);
export const inList = (k, url) => getList(k).some((x) => x.url === url);

// Adds or removes an item, returns the new list.
export const toggleIn = (k, item) => {
  const l = getList(k);
  const n = l.some((x) => x.url === item.url) ? l.filter((x) => x.url !== item.url) : [item, ...l];
  wr(k, n);
  return n;
};

// Adds to the front, moves it up if it already exists (used for history).
export const pushFront = (k, item, max = 200) => {
  const n = [item, ...getList(k).filter((x) => x.url !== item.url)].slice(0, max);
  wr(k, n);
  return n;
};

export const clearList = (k) => wr(k, []);

export function exportAll() {
  const out = {};
  for (const k of ["settings", "history", "likes", "watchlater", "downloads", "subs"]) out[k] = rd(k, k === "settings" ? {} : []);
  out.theme = localStorage.getItem("theme");
  out.mode = localStorage.getItem("mode");
  return JSON.stringify(out, null, 2);
}

export function importAll(text) {
  const d = JSON.parse(text);
  for (const k of ["settings", "history", "likes", "watchlater", "downloads", "subs"]) if (d[k] !== undefined) wr(k, d[k]);
  if (d.theme) localStorage.setItem("theme", d.theme);
  if (d.mode) localStorage.setItem("mode", d.mode);
}
