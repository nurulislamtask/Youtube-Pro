// Checks the latest GitHub Release and tells the app when a newer version exists.
import { hfetch } from "./api.js";

const REPO = "nurulislamtask/Youtube-Pro";

const newer = (a, b) => {
  const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};

function pick(assets) {
  const ua = navigator.userAgent.toLowerCase();
  const find = (re) => assets.find((a) => re.test(a.name))?.browser_download_url;
  if (ua.includes("android")) return find(/\.apk$/i);
  if (ua.includes("windows")) return find(/x64-setup\.exe$/i) || find(/\.msi$/i);
  if (ua.includes("mac")) return find(/\.dmg$/i);
  if (ua.includes("linux")) return find(/\.AppImage$/i) || find(/\.deb$/i);
  return undefined;
}

export async function checkUpdate() {
  try {
    const r = await hfetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) return null;
    const rel = await r.json();
    const latest = (rel.tag_name || "").replace(/^v/, "");
    if (!latest || !newer(latest, __APP_VERSION__)) return null;
    return { version: latest, url: pick(rel.assets || []) || rel.html_url };
  } catch {
    return null;
  }
}

export async function openLink(url) {
  try {
    if (window.__TAURI_INTERNALS__) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      return await openUrl(url);
    }
  } catch {}
  window.open(url, "_blank");
}
