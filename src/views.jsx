import React, { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { THEMES } from "./themes.js";
import { channel, playlist, search, hfetch } from "./api.js";
import { exportAll, importAll, clearList } from "./store.js";

const compact = (n) => Intl.NumberFormat("en", { notation: "compact" }).format(n);
const isVideo = (v) => v.url?.includes("/watch");
const isChannel = (v) => v.url?.startsWith("/channel/");
const isPlaylist = (v) => v.url?.includes("/playlist?list=");
const listId = (u) => (u.match(/list=([^&]+)/) || [])[1];
const clean = (s = "") => s.replace(/ - Topic$/, "");
const visible = (items, settings) => items.filter((v) => isVideo(v) && !(settings.hideShorts && v.isShort));

export function Empty({ text }) {
  return <p className="muted">{text}</p>;
}

export function VideoGrid({ items, settings, onPlay, onNav }) {
  return (
    <div className="grid">
      {visible(items, settings).map((v) => (
        <div className="card" key={v.url}>
          <button onClick={() => onPlay(v)} className="cardbtn">
            <img src={v.thumbnail} alt="" loading="lazy" />
            <b>{v.title}</b>
          </button>
          <span>
            {v.uploaderUrl ? <button className="link" onClick={() => onNav({ page: "artist", arg: v.uploaderUrl })}>{clean(v.uploaderName)}</button> : clean(v.uploaderName)}
            {v.views > 0 ? " · " + compact(v.views) + " views" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SongList({ items, settings, onPlay, numbered = true, cols = 2 }) {
  const list = visible(items, settings);
  return (
    <div className="songs" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {list.map((v, i) => (
        <button className="song" key={v.url + i} onClick={() => onPlay(v)}>
          {numbered && <i>{i + 1}</i>}
          <img src={v.thumbnail} alt="" loading="lazy" />
          <span><b>{v.title}</b><small>{clean(v.uploaderName)}</small></span>
        </button>
      ))}
    </div>
  );
}

export function Chips({ items, onNav }) {
  const list = items.filter(isChannel);
  if (!list.length) return null;
  return (
    <div className="chips">
      {list.slice(0, 8).map((c) => (
        <button key={c.url} className="chip" onClick={() => onNav({ page: "artist", arg: c.url })}>
          <img src={c.thumbnail} alt="" />
          <b>{clean(c.name)}</b>
          {c.subscribers > 0 && <small>{compact(c.subscribers)} subscribers</small>}
        </button>
      ))}
    </div>
  );
}

export function Albums({ items, onNav }) {
  const list = items.filter(isPlaylist);
  if (!list.length) return null;
  return (
    <div className="albums">
      {list.map((a) => (
        <button key={a.url} className="album" onClick={() => onNav({ page: "playlist", arg: listId(a.url), title: a.name })}>
          <img src={a.thumbnail} alt="" loading="lazy" />
          <b>{a.name}</b>
          <small>{clean(a.uploaderName)}</small>
        </button>
      ))}
    </div>
  );
}

function Section({ title, onAll, all, children }) {
  return (
    <section className="sec">
      <div className="sec-h">
        <h3>{title}</h3>
        {onAll && <button className="link" onClick={onAll}>{all ? "Show less" : "Show all"} <Icon n="right" size={14} /></button>}
      </div>
      {children}
    </section>
  );
}

export function ArtistPage({ path, settings, isSub, onFollow, onPlay, onNav }) {
  const [a, setA] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [allSongs, setAllSongs] = useState(false);
  const [allAlb, setAllAlb] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setA(null); setAlbums([]); setErr(""); setAllSongs(false); setAllAlb(false);
    channel(path)
      .then((d) => {
        setA(d);
        search(clean(d.name), "music_albums").then((r) => setAlbums(r.filter(isPlaylist))).catch(() => {});
      })
      .catch(() => setErr("Could not load this artist."));
  }, [path]);

  if (err) return <Empty text={err} />;
  if (!a) return <Empty text="Loading…" />;
  const vids = visible(a.relatedStreams || [], settings);
  const name = clean(a.name);
  const rand = () => vids.length && onPlay(vids[Math.floor(Math.random() * vids.length)]);

  return (
    <>
      <div className="hero">
        <img src={a.avatarUrl} alt="" />
        <div>
          <small className="eyebrow">ARTIST</small>
          <h1 className="big">{name}</h1>
          <p className="muted">{a.subscriberCount > 0 ? compact(a.subscriberCount) + " subscribers" : ""}</p>
          <div className="actions">
            <button className="btn white" onClick={() => vids[0] && onPlay(vids[0])}><Icon n="play" size={18} /> Play</button>
            <button className="btn dark" onClick={() => onFollow({ url: path, name, avatar: a.avatarUrl })}>
              <Icon n={isSub ? "check" : "plus"} size={18} /> {isSub ? "Following" : "Follow"}
            </button>
            <button className="btn round" onClick={rand} aria-label="Shuffle"><Icon n="shuffle" /></button>
            <button className="btn round" onClick={() => onNav({ page: "music", arg: name + " radio" })} aria-label="Radio"><Icon n="radio" /></button>
          </div>
        </div>
      </div>

      <Section title="Popular" onAll={vids.length > 5 ? () => setAllSongs(!allSongs) : null} all={allSongs}>
        <SongList items={allSongs ? vids : vids.slice(0, 5)} settings={settings} onPlay={onPlay} />
      </Section>

      {albums.length > 0 && (
        <Section title="Albums" onAll={albums.length > 6 ? () => setAllAlb(!allAlb) : null} all={allAlb}>
          <div className={allAlb ? "wrapalb" : "rowalb"}>
            <Albums items={allAlb ? albums : albums.slice(0, 12)} onNav={onNav} />
          </div>
        </Section>
      )}
    </>
  );
}

export function PlaylistPage({ id, title, settings, onPlay }) {
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { setP(null); setErr(""); playlist(id).then(setP).catch(() => setErr("Could not load this album.")); }, [id]);
  if (err) return <Empty text={err} />;
  if (!p) return <Empty text="Loading…" />;
  const vids = visible(p.relatedStreams || [], settings);
  return (
    <>
      <div className="hero">
        <img className="square" src={p.thumbnailUrl} alt="" />
        <div>
          <small className="eyebrow">ALBUM</small>
          <h1 className="big small">{p.name || title}</h1>
          <p className="muted">{clean(p.uploader || "")}{p.videos > 0 ? ` · ${p.videos} songs` : ""}</p>
          <div className="actions">
            <button className="btn white" onClick={() => vids[0] && onPlay(vids[0])}><Icon n="play" size={18} /> Play</button>
            <button className="btn round" onClick={() => vids.length && onPlay(vids[Math.floor(Math.random() * vids.length)])} aria-label="Shuffle"><Icon n="shuffle" /></button>
          </div>
        </div>
      </div>
      <SongList items={vids} settings={settings} onPlay={onPlay} cols={1} />
    </>
  );
}

const SECTIONS = [
  ["profiles", "user", "Profiles"],
  ["appearance", "palette", "Appearance"],
  ["player", "play", "Player"],
  ["content", "blocks", "Content & UI"],
  ["taste", "heartline", "Taste"],
  ["network", "net", "Network & Buffer"],
  ["downloads", "download", "Downloads"],
  ["data", "db", "Data & Backup"],
  ["about", "info", "About"],
];

const REGIONS = ["US", "GB", "IN", "BD", "PK", "DE", "FR", "ES", "IT", "BR", "JP", "KR", "CA", "AU"];

function Toggle({ label, desc, on, set }) {
  return (
    <button className="setrow" onClick={() => set(!on)}>
      <span><b>{label}</b><small>{desc}</small></span>
      <i className={"sw2" + (on ? " on" : "")}><em /></i>
    </button>
  );
}

export function SettingsPage({ section, setSection, settings, update, theme, setTheme, mode, setMode, onCheckUpdate, updateInfo }) {
  const [msg, setMsg] = useState("");
  const [probe, setProbe] = useState("");

  const testServer = async () => {
    setProbe("Testing…");
    try {
      const base = (settings.server || "https://pipedapi.kavin.rocks").replace(/\/$/, "");
      const r = await hfetch(base + "/trending?region=US");
      setProbe(r.ok ? "Server works." : "Server answered with an error.");
    } catch {
      setProbe("Could not reach the server.");
    }
  };

  const doExport = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportAll()], { type: "application/json" }));
    a.download = "youtube-pro-backup.json";
    a.click();
  };
  const doImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { importAll(rd.result); setMsg("Imported. Restarting…"); setTimeout(() => location.reload(), 600); } catch { setMsg("That file is not a valid backup."); } };
    rd.readAsText(f);
  };

  let body = null;
  if (section === "appearance") {
    body = (
      <>
        <h1>Appearance</h1>
        <h3 className="h3">Built-in themes</h3>
        <p className="muted">Pick a look. Every theme is free.</p>
        <div className="pills">
          {["light", "dark", "amoled"].map((m) => (
            <button key={m} className={"pill" + (mode === m ? " on" : "")} onClick={() => setMode(m)}>{m === "amoled" ? "AMOLED" : m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </div>
        <div className="themes">
          {THEMES.map((t) => (
            <button key={t.id} className={"theme" + (theme === t.id ? " on" : "")} onClick={() => setTheme(t.id)}>
              <span className="sw">{t.sw.map((c) => <i key={c} style={{ background: c }} />)}</span>
              <span><b>{t.name} {theme === t.id && <Icon n="check" size={14} />}</b><small>{t.desc}</small></span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (section === "profiles") {
    body = (
      <>
        <h1>Profiles</h1>
        <label className="field">Display name
          <input value={settings.profileName} onChange={(e) => update({ profileName: e.target.value })} />
        </label>
        <Toggle label="Private mode" desc="Do not save watch history." on={settings.incognito} set={(v) => update({ incognito: v })} />
      </>
    );
  } else if (section === "player") {
    body = (
      <>
        <h1>Player</h1>
        <Toggle label="SponsorBlock" desc="Automatically skip sponsors, intros and outros." on={settings.sponsorblock} set={(v) => update({ sponsorblock: v })} />
        <Toggle label="Autoplay next" desc="Play the next video when one ends." on={settings.autoplay} set={(v) => update({ autoplay: v })} />
      </>
    );
  } else if (section === "content") {
    body = (
      <>
        <h1>Content &amp; UI</h1>
        <label className="field">Trending region
          <select value={settings.region} onChange={(e) => update({ region: e.target.value })}>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <p className="muted">Reload Home after changing the region.</p>
      </>
    );
  } else if (section === "taste") {
    body = (
      <>
        <h1>Taste</h1>
        <Toggle label="Hide Shorts" desc="Remove short vertical videos from lists." on={settings.hideShorts} set={(v) => update({ hideShorts: v })} />
        <button className="btn dark" onClick={() => { clearList("history"); setMsg("History cleared."); }}>Clear watch history</button>
        <p className="muted">{msg}</p>
      </>
    );
  } else if (section === "network") {
    body = (
      <>
        <h1>Network &amp; Buffer</h1>
        <label className="field">Custom Piped server (optional)
          <input placeholder="https://pipedapi.example.com" value={settings.server} onChange={(e) => update({ server: e.target.value.trim() })} />
        </label>
        <p className="muted">If videos do not load, YouTube Pro tries other servers automatically. Set one here to always try it first.</p>
        <button className="btn dark" onClick={testServer}>Test server</button>
        <p className="muted">{probe}</p>
      </>
    );
  } else if (section === "downloads") {
    body = (
      <>
        <h1>Downloads</h1>
        <p className="muted">Offline downloads are not built yet. The Downloads page currently holds videos you saved.</p>
      </>
    );
  } else if (section === "data") {
    body = (
      <>
        <h1>Data &amp; Backup</h1>
        <p className="muted">Save your settings, history, likes and followed artists to a file, or restore them on another device.</p>
        <div className="actions">
          <button className="btn white" onClick={doExport}>Export backup</button>
          <label className="btn dark">Import backup<input type="file" accept="application/json" hidden onChange={doImport} /></label>
        </div>
        <p className="muted">{msg}</p>
      </>
    );
  } else {
    body = (
      <>
        <h1>About</h1>
        <p>YouTube Pro {__APP_VERSION__}</p>
        <p className="muted">Free and ad-free. Every feature is unlocked. Not affiliated with YouTube or Google.</p>
        <div className="actions">
          <button className="btn white" onClick={onCheckUpdate}>Check for updates</button>
        </div>
        <p className="muted">{updateInfo}</p>
        <p className="muted">Ideas from NouTube, LibreTube and Flow (open source).</p>
      </>
    );
  }

  return (
    <div className="settings">
      <nav className="subnav">
        <h2>Settings</h2>
        {SECTIONS.map(([id, ic, label]) => (
          <button key={id} className={"nav" + (section === id ? " on" : "")} onClick={() => setSection(id)}><Icon n={ic} size={18} fill={false} />{label}</button>
        ))}
      </nav>
      <div className="setbody">{body}</div>
    </div>
  );
}
