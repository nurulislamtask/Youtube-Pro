import React, { useEffect, useRef, useState } from "react";
import { THEMES, applyTheme } from "./themes.js";
import { search, trending, streams, videoId, sponsorSegments, lyrics, channel } from "./api.js";
import { checkUpdate, openLink } from "./update.js";

const NAV = [
  ["home", "⌂", "Home"],
  ["music", "♪", "Music"],
  ["library", "☰", "Library"],
  ["settings", "⚙", "Settings"],
];

const load = (k) => { try { return JSON.parse(localStorage[k] || "[]"); } catch { return []; } };
const compact = (n) => Intl.NumberFormat("en", { notation: "compact" }).format(n);

function Cards({ items, onPlay, onArtist }) {
  return (
    <div className="grid">
      {items.filter((v) => v.url?.includes("watch")).map((v) => (
        <div className="card" key={v.url}>
          <button onClick={() => onPlay(v)} style={{ width: "100%", textAlign: "left" }}>
            <img src={v.thumbnail} alt="" loading="lazy" />
            <b>{v.title}</b>
          </button>
          <span>
            {v.uploaderUrl ? <button onClick={() => onArtist(v.uploaderUrl)} style={{ textDecoration: "underline" }}>{v.uploaderName}</button> : v.uploaderName}
            {v.views > 0 ? " · " + compact(v.views) + " views" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function Artist({ path, onPlay, onArtist }) {
  const [a, setA] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { setA(null); channel(path).then(setA).catch(() => setErr("Could not load this artist.")); }, [path]);
  if (err) return <p>{err}</p>;
  if (!a) return <p>Loading…</p>;
  const vids = (a.relatedStreams || []).filter((v) => v.url?.includes("watch"));
  return (
    <>
      <div className="hero">
        <img src={a.avatarUrl} alt="" />
        <div>
          <small>ARTIST</small>
          <h1>{a.name}</h1>
          <span>{a.subscriberCount > 0 ? compact(a.subscriberCount) + " subscribers" : ""}</span>
          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={() => vids[0] && onPlay(vids[0])}>▶ Play</button>
          </div>
        </div>
      </div>
      <h3>Popular</h3>
      <Cards items={vids.slice(0, 5)} onPlay={onPlay} onArtist={onArtist} />
      <h3 style={{ marginTop: 28 }}>Videos</h3>
      <Cards items={vids} onPlay={onPlay} onArtist={onArtist} />
    </>
  );
}

function Player({ video, onClose, onSave }) {
  const ref = useRef(null);
  const [src, setSrc] = useState("");
  const [lines, setLines] = useState([]);
  const [now, setNow] = useState(0);
  const [segs, setSegs] = useState([]);
  const id = videoId(video.url);

  useEffect(() => {
    streams(id).then((s) => {
      const best = (s.videoStreams || []).filter((x) => !x.videoOnly && x.mimeType.includes("mp4")).sort((a, b) => b.height - a.height)[0];
      setSrc(best?.url || s.hls || "");
      lyrics(s.title || video.title, (s.uploader || video.uploaderName || "").replace(" - Topic", "")).then(setLines);
    }).catch(() => {});
    sponsorSegments(id).then(setSegs);
  }, [id]);

  const tick = () => {
    const t = ref.current.currentTime;
    setNow(t);
    const hit = segs.find((s) => t >= s.segment[0] && t < s.segment[1]);
    if (hit) ref.current.currentTime = hit.segment[1]; // SponsorBlock auto-skip
  };
  const idx = lines.reduce((a, l, i) => (l.t <= now ? i : a), -1);

  return (
    <div className="player">
      <button className="close" onClick={onClose}>✕</button>
      <div>
        <video ref={ref} src={src} controls autoPlay onTimeUpdate={tick} />
        <h2>{video.title}</h2>
        <span>{video.uploaderName}</span>
        <div style={{ marginTop: 12 }}><button className="btn" onClick={() => onSave(video)}>♡ Save to Library</button></div>
      </div>
      <div className="lyrics">
        {lines.length === 0 && <p className="now">No lyrics found</p>}
        {lines.map((l, i) => <p key={i} className={i === idx ? "now" : ""}>{l.text}</p>)}
      </div>
    </div>
  );
}

function Appearance({ theme, setTheme, mode, setMode }) {
  return (
    <>
      <h1>Appearance</h1>
      <h3>Built-in themes</h3>
      <div className="pills">
        {["light", "dark", "amoled"].map((m) => (
          <button key={m} className={"pill" + (mode === m ? " on" : "")} onClick={() => setMode(m)}>{m === "amoled" ? "AMOLED" : m[0].toUpperCase() + m.slice(1)}</button>
        ))}
      </div>
      <div className="themes">
        {THEMES.map((t) => (
          <button key={t.id} className={"theme" + (theme === t.id ? " on" : "")} onClick={() => setTheme(t.id)}>
            <span className="sw">{t.sw.map((c) => <i key={c} style={{ background: c }} />)}</span>
            <span><b>{t.name} {theme === t.id && "✓"}</b><small>{t.desc}</small></span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [theme, setTheme] = useState(localStorage.theme || "monochrome");
  const [mode, setMode] = useState(localStorage.mode || "dark");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState(null);
  const [err, setErr] = useState("");
  const [artist, setArtist] = useState(null);
  const [saved, setSaved] = useState(() => load("saved"));

  const save = (v) => setSaved((s) => {
    const n = s.some((x) => x.url === v.url) ? s : [v, ...s];
    localStorage.saved = JSON.stringify(n);
    return n;
  });
  const openArtist = (path) => { setPlaying(null); setArtist(path); setPage("artist"); };

  useEffect(() => { applyTheme(theme, mode); localStorage.theme = theme; localStorage.mode = mode; }, [theme, mode]);
  const [update, setUpdate] = useState(null);
  const loadHome = () => { setErr(""); trending().then(setItems).catch(() => setErr("Could not load videos. Check your internet, then press Retry.")); };
  useEffect(() => { loadHome(); checkUpdate().then(setUpdate); }, []);

  const go = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    if (page !== "music") setPage("home");
    try { setItems(await search(q, page === "music" ? "music_songs" : "all")); setErr(""); } catch { setErr("Search failed."); }
  };

  return (
    <div className="app">
      <div className="top">
        <div className="logo"><img src="/icon.svg" alt="" />YouTube Pro</div>
        <form className="search" onSubmit={go}><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></form>
        {update && <button className="btn" onClick={() => openLink(update.url)}>⭳ Update to {update.version}</button>}
      </div>
      <div className="body">
        <nav className="side">
          {NAV.map(([id, ic, label]) => (
            <button key={id} className={"nav" + (page === id ? " on" : "")} onClick={() => setPage(id)}>{ic}<span>{label}</span></button>
          ))}
        </nav>
        <main className="main">
          {page === "settings" ? <Appearance {...{ theme, setTheme, mode, setMode }} /> :
           page === "artist" && artist ? <Artist path={artist} onPlay={setPlaying} onArtist={openArtist} /> :
           page === "library" ? (
            <>
              <h1>Library</h1>
              {saved.length === 0 && <p>Nothing saved yet. Open a video and tap "Save to Library".</p>}
              <Cards items={saved} onPlay={setPlaying} onArtist={openArtist} />
            </>
          ) : (
            <>
              <h1>{page === "music" ? "Music" : "Home"}</h1>
              {err && <p>{err} <button className="btn" onClick={loadHome}>Retry</button></p>}
              <Cards items={items} onPlay={setPlaying} onArtist={openArtist} />
            </>
          )}
        </main>
      </div>
      {playing && <Player video={playing} onClose={() => setPlaying(null)} onSave={save} />}
    </div>
  );
}
