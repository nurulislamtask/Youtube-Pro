import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import Player from "./Player.jsx";
import { applyTheme } from "./themes.js";
import { search, trending } from "./api.js";
import { checkUpdate, openLink } from "./update.js";
import { getSettings, setSettings, getList, toggleIn, pushFront } from "./store.js";
import { VideoGrid, SongList, Chips, Albums, ArtistPage, PlaylistPage, SettingsPage, Empty } from "./views.jsx";

const slim = (v) => ({ url: v.url, title: v.title, thumbnail: v.thumbnail, uploaderName: v.uploaderName, uploaderUrl: v.uploaderUrl, views: v.views, duration: v.duration });
const TOPICS = ["Music", "Gaming", "News", "Podcasts", "Movies", "Live", "Sports", "Learning"];

function Feed({ page, arg, settings, onPlay, onNav }) {
  const [items, setItems] = useState([]);
  const [artists, setArtists] = useState([]);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setErr(""); setItems([]); setArtists([]);
    const ok = (r) => live && setItems(r);
    const bad = () => live && setErr("Could not load videos. Check your internet, then press Retry.");
    if (page === "home" || (page === "explore" && !arg)) trending(settings.region).then(ok).catch(bad);
    else if (page === "music") {
      search(arg || "top songs", "music_songs").then(ok).catch(bad);
      if (arg) search(arg, "music_artists").then((r) => live && setArtists(r)).catch(() => {});
    } else search(arg, "all").then(ok).catch(bad);
    return () => { live = false; };
  }, [page, arg, tick, settings.region]);

  const title = page === "home" ? "Home" : page === "explore" ? (arg || "Explore") : page === "music" ? (arg ? `Music: ${arg}` : "Music") : `Results for "${arg}"`;
  return (
    <>
      {page === "explore" && (
        <div className="pills">
          {TOPICS.map((t) => <button key={t} className={"pill" + (arg === t ? " on" : "")} onClick={() => onNav({ page: "explore", arg: t })}>{t}</button>)}
        </div>
      )}
      <h1>{title}</h1>
      {err && <p className="muted">{err} <button className="btn dark" onClick={() => setTick(tick + 1)}>Retry</button></p>}
      <Chips items={[...artists, ...items]} onNav={onNav} />
      <Albums items={items} onNav={onNav} />
      {page === "music" ? <SongList items={items} settings={settings} onPlay={onPlay} numbered={false} /> : <VideoGrid items={items} settings={settings} onPlay={onPlay} onNav={onNav} />}
      {!err && items.length === 0 && <Empty text="Loading…" />}
    </>
  );
}

const YOU = [
  ["history", "history", "History"],
  ["playlists", "list", "Playlists"],
  ["albums", "disc", "Albums"],
  ["watchlater", "clock", "Watch Later"],
  ["likes", "like", "Likes"],
  ["downloads", "download", "Downloads"],
];
const LISTS = { history: "history", watchlater: "watchlater", likes: "likes", downloads: "downloads" };

export default function App() {
  const [stack, setStack] = useState([{ page: "home" }]);
  const [idx, setIdx] = useState(0);
  const view = stack[idx];
  const [settings, setSettingsState] = useState(getSettings);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "monochrome");
  const [mode, setMode] = useState(localStorage.getItem("mode") || "dark");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState(null);
  const [lists, setLists] = useState(() => ({ history: getList("history"), likes: getList("likes"), watchlater: getList("watchlater"), downloads: getList("downloads"), subs: getList("subs") }));
  const [update, setUpdate] = useState(null);
  const [updateInfo, setUpdateInfo] = useState("");
  const [section, setSection] = useState("appearance");
  const [subsOpen, setSubsOpen] = useState(true);
  const [side, setSide] = useState(true);
  const searchRef = useRef(null);

  const upd = (patch) => setSettingsState(setSettings(patch));
  const nav = (v) => { setPlaying(null); setStack([...stack.slice(0, idx + 1), v]); setIdx(idx + 1); };
  const go = (page, arg) => nav({ page, arg });
  const toggleList = (k, item) => setLists((l) => ({ ...l, [k]: toggleIn(k, slim(item)) }));
  const follow = (a) => setLists((l) => ({ ...l, subs: toggleIn("subs", a) }));

  const play = (v) => {
    setPlaying(v);
    if (!settings.incognito) setLists((l) => ({ ...l, history: pushFront("history", slim(v)) }));
  };

  useEffect(() => { applyTheme(theme, mode); localStorage.setItem("theme", theme); localStorage.setItem("mode", mode); }, [theme, mode]);
  useEffect(() => { checkUpdate().then(setUpdate); }, []);
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    go(view.page === "music" ? "music" : "results", q.trim());
  };

  const manualUpdate = async () => {
    setUpdateInfo("Checking…");
    const u = await checkUpdate();
    setUpdate(u);
    setUpdateInfo(u ? `Version ${u.version} is available.` : "You have the latest version.");
  };

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const NavBtn = ({ page, ic, label, arg }) => (
    <button className={"nav" + (["home", "explore", "music", "downloads", "settings"].includes(page) ? " m" : "") + (view.page === page && (!arg || view.arg === arg) ? " on" : "")} onClick={() => go(page, arg)}>
      <Icon n={ic} /><span>{label}</span>
    </button>
  );

  let main;
  const p = view.page;
  if (p === "settings") main = <SettingsPage {...{ section, setSection, settings, update: upd, theme, setTheme, mode, setMode, updateInfo }} onCheckUpdate={manualUpdate} />;
  else if (p === "artist") main = <ArtistPage path={view.arg} settings={settings} isSub={lists.subs.some((s) => s.url === view.arg)} onFollow={follow} onPlay={play} onNav={nav} />;
  else if (p === "playlist") main = <PlaylistPage id={view.arg} title={view.title} settings={settings} onPlay={play} />;
  else if (LISTS[p]) {
    const names = { history: "History", watchlater: "Watch Later", likes: "Likes", downloads: "Downloads" };
    main = (
      <>
        <h1>{names[p]}</h1>
        {p === "downloads" && <p className="muted">Videos you saved. Offline downloads are coming later.</p>}
        {lists[p].length === 0 ? <Empty text="Nothing here yet." /> : <SongList items={lists[p]} settings={settings} onPlay={play} numbered={false} />}
      </>
    );
  } else if (p === "playlists" || p === "albums") main = <><h1>{p === "albums" ? "Albums" : "Playlists"}</h1><Empty text="Coming soon." /></>;
  else if (p === "blockads") main = <><h1>Block Ads</h1><p>Ads are always off. YouTube Pro plays ad-free streams, and SponsorBlock skips sponsor segments (you can turn it off in Settings, Player).</p></>;
  else if (p === "profile") main = <><h1>Profile</h1><p className="muted">{settings.profileName}. Change your name in Settings, Profiles.</p><button className="btn dark" onClick={() => { setSection("profiles"); go("settings"); }}>Open profile settings</button></>;
  else main = <Feed key={p} page={p} arg={view.arg} settings={settings} onPlay={play} onNav={nav} />;

  return (
    <div className={"app" + (side ? "" : " noside")}>
      <header className="top">
        <button className="ic" onClick={() => setSide(!side)} aria-label="Toggle sidebar"><Icon n="panel" /></button>
        <div className="logo"><img src="/icon.svg" alt="" /><span>YouTube Pro</span></div>
        <button className="ic" disabled={idx === 0} onClick={() => setIdx(idx - 1)} aria-label="Back"><Icon n="back" /></button>
        <button className="ic" disabled={idx >= stack.length - 1} onClick={() => setIdx(idx + 1)} aria-label="Forward"><Icon n="fwd" /></button>
        <form className="search" onSubmit={submit}>
          <Icon n="search" size={16} />
          <input ref={searchRef} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
        </form>
        {update && <button className="btn white sm" onClick={() => openLink(update.url)}><Icon n="download" size={16} /> Update {update.version}</button>}
        <button className="ic" onClick={() => (update ? openLink(update.url) : go("settings") || setSection("about"))} aria-label="Notifications"><Icon n="bell" />{update && <b className="dot" />}</button>
        <button className={"ic" + (settings.incognito ? " on" : "")} onClick={() => upd({ incognito: !settings.incognito })} aria-label="Private mode" title="Private mode"><Icon n="incognito" /></button>
        <button className="ic" onClick={() => go("settings")} aria-label="Settings"><Icon n="settings" /></button>
        <button className="avatar" onClick={() => go("profile")} aria-label="Profile">{(settings.profileName || "Y")[0].toUpperCase()}</button>
      </header>

      <div className="body">
        <nav className="side">
          <NavBtn page="home" ic="home" label="Home" />
          <NavBtn page="explore" ic="compass" label="Explore" />
          <NavBtn page="music" ic="music" label="Music" />
          <hr />
          <button className="grp" onClick={() => setSubsOpen(!subsOpen)}>Subscriptions <Icon n="right" size={14} /><span style={{ flex: 1 }} /><Icon n="down" size={16} /></button>
          {subsOpen && lists.subs.map((s) => (
            <button key={s.url} className="nav sub" onClick={() => go("artist", s.url)}><img src={s.avatar} alt="" /><span>{s.name}</span></button>
          ))}
          {subsOpen && lists.subs.length === 0 && <small className="hint">Follow an artist to see them here.</small>}
          <hr />
          <div className="grp">You <Icon n="right" size={14} /></div>
          {YOU.map(([pg, ic, label]) => <NavBtn key={pg} page={pg} ic={ic} label={label} />)}
          <div className="grow" />
          <NavBtn page="profile" ic="user" label="Profile" />
          <NavBtn page="settings" ic="settings" label="Settings" />
          <NavBtn page="blockads" ic="blocks" label="Block Ads" />
        </nav>
        <main className="main">{main}</main>
      </div>

      {playing && (
        <Player
          key={playing.url}
          video={playing} settings={settings}
          liked={lists.likes.some((x) => x.url === playing.url)}
          saved={lists.downloads.some((x) => x.url === playing.url)}
          onLike={(v) => toggleList("likes", v)}
          onSave={(v) => toggleList("downloads", v)}
          onWatchLater={(v) => toggleList("watchlater", v)}
          onClose={() => setPlaying(null)} onPlay={play}
          onArtist={(path) => go("artist", path)}
        />
      )}
    </div>
  );
}
