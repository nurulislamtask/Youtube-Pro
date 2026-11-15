/* YouTube Pro: runs inside the real YouTube page.
   Adds ad blocking, SponsorBlock, themes, Shorts hiding and an update notice. */
(function () {
  if (window.__ytpro) return;
  window.__ytpro = true;

  var KEY = "ytpro_settings";
  var DEF = { theme: "default", mode: "default", adblock: true, sponsor: true, hideShorts: false, background: true };
  var S = Object.assign({}, DEF);
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  var THEMES = [
    ["default", "YouTube Red", "#ff0033"], ["monochrome", "Monochrome", "#f2f2f2"], ["catppuccin", "Catppuccin", "#cba6f7"],
    ["green-apple", "Green Apple", "#a6e22e"], ["lavender", "Lavender", "#c9a7f5"], ["nord", "Nord", "#88c0d0"],
    ["tako", "Tako", "#c3a6ff"], ["yin-yang", "Yin & Yang", "#ffffff"], ["strawberry", "Strawberry Daiquiri", "#f4a6b8"],
    ["kanagawa", "Kanagawa", "#e6c384"], ["tokyo-night", "Tokyo Night", "#7aa2f7"], ["rose-pine", "Rosé Pine", "#c4a7e7"],
    ["everforest", "Everforest", "#a7c080"], ["gruvbox", "Gruvbox", "#fabd2f"], ["dracula", "Dracula", "#bd93f9"],
    ["solarized", "Solarized", "#2aa198"]
  ];
  var MODES = {
    light: { bg: "#ffffff", surface: "#f2f2f2", surface2: "#e5e5e5", text: "#0f0f0f", muted: "#606060", border: "#d9d9d9" },
    dark: { bg: "#0f0f0f", surface: "#181818", surface2: "#272727", text: "#f1f1f1", muted: "#aaaaaa", border: "#303030" },
    amoled: { bg: "#000000", surface: "#0a0a0a", surface2: "#1a1a1a", text: "#f1f1f1", muted: "#a0a0a0", border: "#1f1f1f" }
  };

  /* ---------- Ad blocking (data level) ---------- */
  function strip(o) {
    if (!o || typeof o !== "object") return o;
    if (o.adPlacements) o.adPlacements = [];
    if (o.playerAds) o.playerAds = [];
    if (o.adSlots) o.adSlots = [];
    if (o.playerResponse) strip(o.playerResponse);
    if (o.response && o.response.playerResponse) strip(o.response.playerResponse);
    return o;
  }
  var _parse = JSON.parse;
  JSON.parse = function () {
    var o = _parse.apply(this, arguments);
    try { if (S.adblock) strip(o); } catch (e) {}
    return o;
  };
  try {
    var _json = Response.prototype.json;
    Response.prototype.json = function () {
      return _json.call(this).then(function (o) { try { if (S.adblock) strip(o); } catch (e) {} return o; });
    };
  } catch (e) {}
  try {
    var _ipr;
    Object.defineProperty(window, "ytInitialPlayerResponse", {
      configurable: true,
      get: function () { return _ipr; },
      set: function (v) { try { if (S.adblock) strip(v); } catch (e) {} _ipr = v; }
    });
  } catch (e) {}

  /* Keep playing when the window is minimised or hidden */
  if (S.background) {
    try {
      Object.defineProperty(document, "hidden", { get: function () { return false; }, configurable: true });
      Object.defineProperty(document, "visibilityState", { get: function () { return "visible"; }, configurable: true });
      var stop = function (e) { e.stopImmediatePropagation(); };
      document.addEventListener("visibilitychange", stop, true);
      window.addEventListener("visibilitychange", stop, true);
    } catch (e) {}
  }

  /* ---------- Styles ---------- */
  var AD_CSS = [
    "#player-ads", "#masthead-ad", "ytd-ad-slot-renderer", "ytd-in-feed-ad-layout-renderer", "ytd-display-ad-renderer",
    "ytd-promoted-sparkles-web-renderer", "ytd-promoted-video-renderer", "ytd-banner-promo-renderer", "ytd-statement-banner-renderer",
    "ytd-companion-slot-renderer", "ytd-action-companion-ad-renderer", ".ytp-ad-module", ".ytp-ad-overlay-container",
    "ytm-promoted-sparkles-web-renderer", "ytm-companion-ad-renderer", "ytm-promoted-video-renderer", "ytm-ad-slot-renderer",
    ".ad-container", ".video-ads", "ytd-enforcement-message-view-model", "tp-yt-iron-overlay-backdrop.opened"
  ].join(",") + "{display:none!important}";
  var SHORTS_CSS = [
    "ytd-reel-shelf-renderer", "ytd-rich-shelf-renderer[is-shorts]", "ytm-reel-shelf-renderer", "ytm-shorts-lockup-view-model",
    "ytd-guide-entry-renderer:has(a[title='Shorts'])", "ytd-mini-guide-entry-renderer[aria-label='Shorts']", "a[title='Shorts']"
  ].join(",") + "{display:none!important}";

  function styleEl(id) {
    var e = document.getElementById(id);
    if (!e) {
      e = document.createElement("style");
      e.id = id;
      (document.head || document.documentElement).appendChild(e);
    }
    return e;
  }

  function themeCss() {
    if (S.mode === "default" && S.theme === "default") return "";
    var t = THEMES.filter(function (x) { return x[0] === S.theme; })[0] || THEMES[0];
    var a = t[2];
    var css = "";
    if (S.mode !== "default") {
      var m = MODES[S.mode];
      css += "html,html[dark]{color-scheme:" + (S.mode === "light" ? "light" : "dark") + ";" +
        "--yt-spec-base-background:" + m.bg + "!important;--yt-spec-general-background-a:" + m.bg + "!important;" +
        "--yt-spec-general-background-b:" + m.surface + "!important;--yt-spec-general-background-c:" + m.surface2 + "!important;" +
        "--yt-spec-raised-background:" + m.surface + "!important;--yt-spec-menu-background:" + m.surface + "!important;" +
        "--yt-spec-badge-chip-background:" + m.surface2 + "!important;--yt-spec-button-chip-background:" + m.surface2 + "!important;" +
        "--yt-spec-text-primary:" + m.text + "!important;--yt-spec-text-secondary:" + m.muted + "!important;" +
        "--yt-spec-10-percent-layer:" + m.border + "!important;--yt-spec-outline:" + m.border + "!important;}" +
        "html,body,ytd-app,#background,ytm-app{background:" + m.bg + "!important}";
    }
    if (S.theme !== "default") {
      css += "html,html[dark]{--yt-spec-call-to-action:" + a + "!important;--yt-spec-themed-blue:" + a + "!important;" +
        "--yt-spec-static-brand-red:" + a + "!important;--yt-spec-brand-button-background:" + a + "!important;}" +
        ".ytp-play-progress,.ytp-swatch-background-color{background:" + a + "!important}";
    }
    return css;
  }

  function applyAll() {
    try {
      styleEl("ytpro-theme").textContent = themeCss();
      styleEl("ytpro-hide").textContent = (S.adblock ? AD_CSS : "") + (S.hideShorts ? SHORTS_CSS : "");
    } catch (e) {}
  }
  applyAll();

  /* ---------- Helpers ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") e.className = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (Array.isArray(c)) c.forEach(function (x) { e.append(x); });
      else if (c != null) e.append(c);
    }
    return e;
  }

  var toastTimer;
  function toast(text) {
    var t = document.getElementById("ytpro-toast");
    if (!t) { t = h("div", { id: "ytpro-toast" }); document.body.appendChild(t); }
    t.textContent = text;
    t.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.opacity = "0"; }, 2500);
  }

  /* ---------- Settings panel ---------- */
  var UI_CSS =
    "#ytpro-fab{position:fixed;right:14px;bottom:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(30,30,30,.85);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;cursor:pointer;z-index:2147483646;box-shadow:0 2px 10px rgba(0,0,0,.4)}" +
    "#ytpro-fab:hover{background:#ff0033}" +
    "#ytpro-panel{position:fixed;right:14px;bottom:62px;width:min(360px,calc(100vw - 28px));max-height:calc(100vh - 90px);overflow:auto;background:#181818;color:#f1f1f1;border:1px solid #333;border-radius:16px;padding:16px;z-index:2147483647;font:13px/1.4 Roboto,Arial,sans-serif;box-shadow:0 8px 40px rgba(0,0,0,.6)}" +
    "#ytpro-panel h3{margin:0 0 10px;font-size:16px}#ytpro-panel h4{margin:14px 0 6px;font-size:12px;color:#aaa;font-weight:500;text-transform:uppercase;letter-spacing:.06em}" +
    "#ytpro-panel .row{display:flex;flex-wrap:wrap;gap:6px}" +
    "#ytpro-panel button.pill{border:0;border-radius:999px;padding:6px 12px;background:#2a2a2a;color:#f1f1f1;cursor:pointer;font:inherit}" +
    "#ytpro-panel button.pill.on{background:#f1f1f1;color:#0f0f0f}" +
    "#ytpro-panel .themes{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
    "#ytpro-panel button.th{display:flex;align-items:center;gap:8px;border:1px solid #333;border-radius:10px;padding:7px 9px;background:#202020;color:#f1f1f1;cursor:pointer;font:inherit;text-align:left}" +
    "#ytpro-panel button.th.on{border-color:#f1f1f1;background:#2c2c2c}" +
    "#ytpro-panel button.th i{width:14px;height:14px;border-radius:50%;flex:none}" +
    "#ytpro-panel button.tg{display:flex;justify-content:space-between;align-items:center;width:100%;border:0;border-bottom:1px solid #2a2a2a;padding:10px 0;background:none;color:#f1f1f1;cursor:pointer;font:inherit;text-align:left}" +
    "#ytpro-panel .sw{width:38px;height:22px;border-radius:999px;background:#444;position:relative;flex:none}" +
    "#ytpro-panel .sw:after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#aaa;transition:.15s}" +
    "#ytpro-panel .sw.on{background:#f1f1f1}#ytpro-panel .sw.on:after{left:19px;background:#0f0f0f}" +
    "#ytpro-panel small{display:block;color:#aaa;margin-top:2px}" +
    "#ytpro-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);background:#222;color:#fff;padding:8px 16px;border-radius:999px;z-index:2147483647;opacity:0;transition:opacity .25s;pointer-events:none;font:13px Roboto,Arial,sans-serif}" +
    "#ytpro-update{position:fixed;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;background:#222;color:#fff;padding:8px 8px 8px 16px;border-radius:999px;z-index:2147483647;font:13px Roboto,Arial,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.5)}" +
    "#ytpro-update button{border:0;border-radius:999px;padding:6px 14px;background:#f1f1f1;color:#0f0f0f;cursor:pointer;font:600 13px Roboto,Arial,sans-serif}";

  var panel, fab;
  function toggleRow(label, desc, key) {
    return h("button", { class: "tg", onclick: function () { S[key] = !S[key]; save(); applyAll(); render(); if (key === "background") toast("Restart the app to apply"); } },
      h("span", {}, label, h("small", {}, desc)),
      h("span", { class: "sw" + (S[key] ? " on" : "") }));
  }
  function render() {
    if (!panel) return;
    panel.replaceChildren(
      h("h3", {}, "YouTube Pro"),
      h("h4", {}, "Mode"),
      h("div", { class: "row" }, [["default", "YouTube"], ["light", "Light"], ["dark", "Dark"], ["amoled", "AMOLED"]].map(function (m) {
        return h("button", { class: "pill" + (S.mode === m[0] ? " on" : ""), onclick: function () { S.mode = m[0]; save(); applyAll(); render(); } }, m[1]);
      })),
      h("h4", {}, "Theme"),
      h("div", { class: "themes" }, THEMES.map(function (t) {
        return h("button", { class: "th" + (S.theme === t[0] ? " on" : ""), onclick: function () { S.theme = t[0]; save(); applyAll(); render(); } },
          h("i", { style: "background:" + t[2] }), t[1]);
      })),
      h("h4", {}, "Features (all free)"),
      toggleRow("Block ads", "Skips video ads and hides ad slots", "adblock"),
      toggleRow("SponsorBlock", "Skips sponsors, intros and outros", "sponsor"),
      toggleRow("Hide Shorts", "Removes Shorts from the page", "hideShorts"),
      toggleRow("Keep playing in background", "Do not pause when minimised", "background"),
      h("small", { style: "margin-top:10px" }, "Version " + (window.__YTPRO_VERSION__ || "?"))
    );
  }
  function mountUi() {
    if (document.getElementById("ytpro-fab") || !document.body) return;
    styleEl("ytpro-ui").textContent = UI_CSS;
    panel = h("div", { id: "ytpro-panel", style: "display:none" });
    fab = h("button", { id: "ytpro-fab", title: "YouTube Pro settings", onclick: function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    } }, "PRO");
    document.body.append(panel, fab);
    render();
  }

  /* ---------- Update notice ---------- */
  function newer(a, b) {
    var x = a.split(".").map(Number), y = (b || "0").split(".").map(Number);
    for (var i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return false;
  }
  function checkUpdate() {
    fetch("https://api.github.com/repos/nurulislamtask/Youtube-Pro/releases/latest")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rel) {
        if (!rel) return;
        var latest = (rel.tag_name || "").replace(/^v/, "");
        if (!latest || !newer(latest, window.__YTPRO_VERSION__)) return;
        var ua = navigator.userAgent.toLowerCase();
        var re = ua.indexOf("android") >= 0 ? /\.apk$/i : ua.indexOf("windows") >= 0 ? /x64-setup\.exe$/i : ua.indexOf("mac") >= 0 ? /\.dmg$/i : /\.AppImage$/i;
        var asset = (rel.assets || []).filter(function (a) { return re.test(a.name); })[0];
        var url = asset ? asset.browser_download_url : rel.html_url;
        var bar = h("div", { id: "ytpro-update" }, "YouTube Pro " + latest + " is available",
          h("button", { onclick: function () { location.href = url; } }, "Update"),
          h("button", { style: "background:#444;color:#fff", onclick: function () { bar.remove(); } }, "Later"));
        document.body.appendChild(bar);
      })
      .catch(function () {});
  }

  /* ---------- Ad skipping and SponsorBlock loop ---------- */
  var SKIP = ".ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button,.ytp-ad-overlay-close-button,.ytp-ad-skip-button-container button";
  var mutedByUs = false, sbId = null, sbSegs = [];

  function curId() {
    try {
      var u = new URL(location.href);
      if (u.pathname.indexOf("/shorts/") === 0) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    } catch (e) { return null; }
  }
  function loadSB(id) {
    sbSegs = [];
    if (!id) return;
    var cats = encodeURIComponent(JSON.stringify(["sponsor", "selfpromo", "interaction", "intro", "outro"]));
    fetch("https://sponsor.ajay.app/api/skipSegments?videoID=" + id + "&categories=" + cats)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { if (id === curId()) sbSegs = list.map(function (x) { return x.segment; }); })
      .catch(function () {});
  }

  function tick() {
    var v = document.querySelector("video");
    var p = document.querySelector(".html5-video-player");

    if (S.adblock) {
      if (p && p.classList.contains("ad-showing")) {
        if (v) {
          if (!v.muted) { v.muted = true; mutedByUs = true; }
          if (isFinite(v.duration) && v.duration > 0 && v.currentTime < v.duration - 0.2) {
            try { v.currentTime = v.duration - 0.1; } catch (e) {}
          }
        }
        document.querySelectorAll(SKIP).forEach(function (b) { try { b.click(); } catch (e) {} });
      } else if (mutedByUs && v) {
        v.muted = false;
        mutedByUs = false;
      }
      var warn = document.querySelector("ytd-enforcement-message-view-model");
      if (warn) {
        var d = warn.closest("tp-yt-paper-dialog");
        if (d) d.remove();
        var bd = document.querySelector("tp-yt-iron-overlay-backdrop");
        if (bd) bd.remove();
        if (document.body) document.body.style.overflow = "auto";
        if (v && v.paused) { try { v.play(); } catch (e) {} }
      }
    }

    if (S.sponsor && v) {
      var id = curId();
      if (id !== sbId) { sbId = id; loadSB(id); }
      var t = v.currentTime;
      for (var i = 0; i < sbSegs.length; i++) {
        if (t >= sbSegs[i][0] && t < sbSegs[i][1] - 0.3) {
          v.currentTime = sbSegs[i][1];
          toast("Skipped a sponsor segment");
          break;
        }
      }
    }
  }

  function start() {
    applyAll();
    mountUi();
    setInterval(tick, 300);
    setTimeout(checkUpdate, 4000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
