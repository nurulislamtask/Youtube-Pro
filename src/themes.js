// Built-in themes (names/descriptions follow the Appearance screen).
// Each theme: [accent, accent2, accent3] swatches + base colors per mode.
export const THEMES = [
  { id: "default", name: "YouTube Pro Default", desc: "The original YouTube Pro palette with the YouTube red accent.", sw: ["#ff0033", "#e8e8e8", "#6b6b6b"], accent: "#ff0033" },
  { id: "monochrome", name: "Monochrome", desc: "A neutral, distraction-free palette with maximum clarity.", sw: ["#f2f2f2", "#bdbdbd", "#6b6b6b"], accent: "#f2f2f2" },
  { id: "catppuccin", name: "Catppuccin", desc: "Soothing pastel Latte and Mocha-inspired colors.", sw: ["#cba6f7", "#a6a0d8", "#6c6f85"], accent: "#cba6f7" },
  { id: "green-apple", name: "Green Apple", desc: "Fresh green accents with soft organic surfaces.", sw: ["#a6e22e", "#8bc34a", "#5a6b45"], accent: "#a6e22e" },
  { id: "lavender", name: "Lavender", desc: "Calm violet tones with gentle contrast.", sw: ["#c9a7f5", "#a78bd9", "#5f5a73"], accent: "#c9a7f5" },
  { id: "nord", name: "Nord", desc: "An arctic, north-bluish palette.", sw: ["#88c0d0", "#81a1c1", "#4c566a"], accent: "#88c0d0" },
  { id: "tako", name: "Tako", desc: "Mihon-inspired purple with warm companion tones.", sw: ["#c3a6ff", "#a58bd9", "#6b5f80"], accent: "#c3a6ff" },
  { id: "yin-yang", name: "Yin & Yang", desc: "Balanced black and white in its purest form.", sw: ["#ffffff", "#9a9a9a", "#3a3a3a"], accent: "#ffffff" },
  { id: "strawberry", name: "Strawberry Daiquiri", desc: "A bright berry palette with soft cream surfaces.", sw: ["#f4a6b8", "#d68a9e", "#7a5a64"], accent: "#f4a6b8" },
  { id: "kanagawa", name: "Kanagawa", desc: "Inky blues and warm lotus tones inspired by Hokusai.", sw: ["#e6c384", "#c8b88a", "#54546d"], accent: "#e6c384" },
  { id: "tokyo-night", name: "Tokyo Night", desc: "Calm blue-violet colors drawn from the night city.", sw: ["#7aa2f7", "#9d7cd8", "#565f89"], accent: "#7aa2f7" },
  { id: "rose-pine", name: "Rosé Pine", desc: "Natural pine, rose, and gold-tinted neutrals.", sw: ["#c4a7e7", "#ebbcba", "#6e6a86"], accent: "#c4a7e7" },
  { id: "everforest", name: "Everforest", desc: "A soft, low-contrast forest palette.", sw: ["#a7c080", "#83c092", "#5c6a5a"], accent: "#a7c080" },
  { id: "gruvbox", name: "Gruvbox", desc: "Warm, earthy retro colors.", sw: ["#fabd2f", "#d79921", "#7c6f64"], accent: "#fabd2f" },
  { id: "dracula", name: "Dracula", desc: "The classic high-contrast purple palette.", sw: ["#bd93f9", "#ff79c6", "#6272a4"], accent: "#bd93f9" },
  { id: "solarized", name: "Solarized", desc: "A precision low-glare blue and cyan palette.", sw: ["#2aa198", "#268bd2", "#586e75"], accent: "#2aa198" },
];

export const MODES = {
  light: { bg: "#fafafa", surface: "#ffffff", surface2: "#efefef", text: "#111111", muted: "#606060", border: "#dcdcdc" },
  dark: { bg: "#0f0f0f", surface: "#171717", surface2: "#232323", text: "#f1f1f1", muted: "#a0a0a0", border: "#2a2a2a" },
  amoled: { bg: "#000000", surface: "#080808", surface2: "#151515", text: "#f1f1f1", muted: "#9a9a9a", border: "#1c1c1c" },
};

export function applyTheme(themeId, mode) {
  const t = THEMES.find((x) => x.id === themeId) || THEMES[0];
  const m = MODES[mode] || MODES.dark;
  const r = document.documentElement.style;
  r.setProperty("--accent", t.accent);
  r.setProperty("--accent-fg", ["monochrome", "yin-yang"].includes(t.id) && mode === "light" ? "#fff" : "#000");
  Object.entries(m).forEach(([k, v]) => r.setProperty(`--${k}`, v));
}
