import React, { useEffect, useRef, useState } from "react";
import { THEMES, applyTheme } from "./themes.js";
import { search, trending, streams, videoId, sponsorSegments, lyrics } from "./api.js";

const NAV = [
  ["home", "⌂", "Home"],
  ["music", "♪", "Music"],
  ["downloads", "⭳", "Downloads"],
  ["settings", "⚙", "Settings"],
];

function Cards({ items, onPlay }) {
  return (
    <div className="grid">
      {items.filter((v) => v.url?.includes("watch")).map((v) => (
        <button className="card" key={v.url} onClick={() => onPlay(v)}>
          <img src={v.thumbnail} alt="" loading="lazy" />
          <b>{v.title}</b>
          <span>{v.uploaderName} · {v.views > 0 ? Intl.NumberFormat("en", { notation: "compact" }).format(v.views) + " views" : ""}</span>
        </button>
      ))}
    </div>
  );
}

function Player({ video, onClose }) {
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

  useEffect(() => { applyTheme(theme, mode); localStorage.theme = theme; localStorage.mode = mode; }, [theme, mode]);
  useEffect(() => { trending().then(setItems).catch(() => setErr("Could not load videos. Check your connection.")); }, []);

  const go = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setPage("home");
    try { setItems(await search(q, page === "music" ? "music_songs" : "all")); setErr(""); } catch { setErr("Search failed."); }
  };

  return (
    <div className="app">
      <div className="top">
        <div className="logo"><img src="/icon.svg" alt="" />YouTube Pro</div>
        <form className="search" onSubmit={go}><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></form>
      </div>
      <div className="body">
        <nav className="side">
          {NAV.map(([id, ic, label]) => (
            <button key={id} className={"nav" + (page === id ? " on" : "")} onClick={() => setPage(id)}>{ic}<span>{label}</span></button>
          ))}
        </nav>
        <main className="main">
          {page === "settings" ? <Appearance {...{ theme, setTheme, mode, setMode }} /> : (
            <>
              <h1>{page === "music" ? "Music" : page === "downloads" ? "Downloads" : "Home"}</h1>
              {err && <p>{err}</p>}
              <Cards items={items} onPlay={setPlaying} />
            </>
          )}
        </main>
      </div>
      {playing && <Player video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
