import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { streams, videoId, sponsorSegments, lyrics } from "./api.js";

const fmt = (s) => {
  if (!isFinite(s)) return "0:00";
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function Player({ video, settings, liked, saved, onLike, onSave, onClose, onPlay, onArtist, onWatchLater }) {
  const ref = useRef(null);
  const activeLine = useRef(null);
  const [src, setSrc] = useState("");
  const [info, setInfo] = useState(null);
  const [lines, setLines] = useState([]);
  const [segs, setSegs] = useState([]);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [paused, setPaused] = useState(true);
  const [tab, setTab] = useState("lyrics");
  const [loop, setLoop] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [err, setErr] = useState("");
  const id = videoId(video.url);

  useEffect(() => {
    setSrc(""); setInfo(null); setLines([]); setSegs([]); setErr(""); setT(0);
    streams(id)
      .then((s) => {
        setInfo(s);
        const combined = (s.videoStreams || []).filter((x) => !x.videoOnly && /mp4/.test(x.mimeType)).sort((a, b) => b.height - a.height)[0];
        const audio = (s.audioStreams || []).sort((a, b) => b.bitrate - a.bitrate)[0];
        setSrc(combined?.url || s.hls || audio?.url || "");
        lyrics(s.title || video.title, (s.uploader || video.uploaderName || "").replace(/ - Topic$/, "")).then(setLines);
      })
      .catch(() => setErr("Could not load this video. Try another one."));
    if (settings.sponsorblock) sponsorSegments(id).then(setSegs);
  }, [id]);

  const next = (info?.relatedStreams || []).filter((v) => v.url?.includes("watch"));
  const goNext = () => {
    if (!next.length) return;
    onPlay(shuffle ? next[Math.floor(Math.random() * next.length)] : next[0]);
  };

  const tick = () => {
    const v = ref.current;
    if (!v) return;
    setT(v.currentTime);
    const hit = segs.find((s) => v.currentTime >= s.segment[0] && v.currentTime < s.segment[1]);
    if (hit) v.currentTime = hit.segment[1]; // SponsorBlock auto-skip
  };

  const idx = lines.reduce((a, l, i) => (l.t <= t ? i : a), -1);
  useEffect(() => { activeLine.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [idx]);

  const toggle = () => { const v = ref.current; if (v) (v.paused ? v.play() : v.pause()); };
  const title = info?.title || video.title;
  const by = (info?.uploader || video.uploaderName || "").replace(/ - Topic$/, "");

  return (
    <div className="player">
      <video
        ref={ref} className="pl-bg" src={src} autoPlay loop={loop}
        onTimeUpdate={tick} onLoadedMetadata={(e) => setDur(e.target.duration)}
        onPlay={() => setPaused(false)} onPause={() => setPaused(true)}
        onEnded={() => settings.autoplay && !loop && goNext()}
        onClick={toggle} poster={video.thumbnail}
      />
      <div className="pl-shade" />

      <div className="pl-top">
        <button className="ic" onClick={onClose} aria-label="Close player"><Icon n="down" size={24} /></button>
        <span style={{ flex: 1 }} />
        <button className="ic" onClick={() => onWatchLater(video)} aria-label="Watch later" title="Watch later"><Icon n="clock" /></button>
        <button className={"ic" + (saved ? " on" : "")} onClick={() => onSave(video)} aria-label="Save to Downloads" title="Save to Downloads"><Icon n="download" /></button>
        <button className="ic" onClick={() => setTab(tab === "next" ? "lyrics" : "next")} aria-label="Queue"><Icon n="queue" /></button>
        <button className={"ic" + (tab === "lyrics" ? " on" : "")} onClick={() => setTab("lyrics")} aria-label="Lyrics"><Icon n="mic" /></button>
      </div>

      <div className="pl-info">
        <div className="pl-title">
          <h2 title={title}>{title}</h2>
          <button className="ic" onClick={() => onLike(video)} aria-label="Like"><Icon n="heart" fill={liked} /></button>
        </div>
        <button className="pl-by" onClick={() => video.uploaderUrl && onArtist(video.uploaderUrl)}>{by}</button>
        {err && <p className="pl-err">{err}</p>}

        <div className="seek">
          <span>{fmt(t)}</span>
          <input type="range" min="0" max={dur || 1} step="0.1" value={t} style={{ "--p": `${dur ? (t / dur) * 100 : 0}%` }}
            onChange={(e) => { ref.current.currentTime = +e.target.value; setT(+e.target.value); }} />
          <span>-{fmt(dur - t)}</span>
        </div>

        <div className="ctrl">
          <button className={"ic" + (shuffle ? " on" : "")} onClick={() => setShuffle(!shuffle)} aria-label="Shuffle"><Icon n="shuffle" /></button>
          <button className="ic" onClick={() => { ref.current.currentTime = 0; }} aria-label="Restart"><Icon n="prev" size={24} fill /></button>
          <button className="big" onClick={toggle} aria-label={paused ? "Play" : "Pause"}><Icon n={paused ? "play" : "pause"} size={26} /></button>
          <button className="ic" onClick={goNext} aria-label="Next"><Icon n="next" size={24} fill /></button>
          <button className={"ic" + (loop ? " on" : "")} onClick={() => setLoop(!loop)} aria-label="Repeat"><Icon n="repeat" /></button>
        </div>
      </div>

      <aside className="panel">
        <div className="tabs">
          <button className={tab === "next" ? "on" : ""} onClick={() => setTab("next")}>Next up</button>
          <button className={tab === "lyrics" ? "on" : ""} onClick={() => setTab("lyrics")}>Lyrics</button>
        </div>
        {tab === "lyrics" ? (
          <div className="lyr">
            {lines.length === 0 && <p className="now">No lyrics found for this video.</p>}
            {lines.map((l, i) => (
              <p key={i} ref={i === idx ? activeLine : null} className={i === idx ? "now" : ""}
                onClick={() => { ref.current.currentTime = l.t; }}>{l.text}</p>
            ))}
          </div>
        ) : (
          <div className="lyr nextlist">
            {next.slice(0, 20).map((v) => (
              <button key={v.url} className="row" onClick={() => onPlay(v)}>
                <img src={v.thumbnail} alt="" />
                <span><b>{v.title}</b><small>{v.uploaderName}</small></span>
              </button>
            ))}
            {next.length === 0 && <p className="now">Nothing queued.</p>}
          </div>
        )}
      </aside>
    </div>
  );
}
