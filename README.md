<p align="center">
  <img src="public/icon.svg" width="120" alt="YouTube Pro icon" />
</p>

<h1 align="center">YouTube Pro</h1>

<p align="center">
  A free, ad-free YouTube client for every device. Every feature is unlocked, with no premium tier.
</p>

<p align="center">
  <img alt="Windows" src="https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white" />
  <img alt="Linux" src="https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black" />
  <img alt="macOS" src="https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white" />
  <img alt="Android" src="https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white" />
  <img alt="iOS" src="https://img.shields.io/badge/iOS-000000?logo=ios&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
</p>

## Features

| | |
|---|---|
| Home, trending and search | Powered by the open Piped API |
| Video playback | Up to the best available quality |
| Music and lyrics | Full-screen player with synced lyrics (LRCLIB) |
| SponsorBlock | Automatically skips sponsors, intros and outros |
| 16 themes | Light, Dark and AMOLED modes (Monochrome, Catppuccin, Nord, Dracula, Gruvbox and more) |
| Responsive | Desktop sidebar, mobile bottom bar |

## Download

Get the latest installer for your device from the [Releases](../../releases) page.

| Platform | File |
|---|---|
| Windows | `.msi` / `.exe` |
| Linux | `.AppImage` / `.deb` / `.rpm` |
| macOS | `.dmg` |
| Android | `.apk` |
| iOS | Build from source (needs a Mac and Apple signing) |

## Run from source

```bash
npm install
npx tauri icon public/icon.svg
npm run tauri dev
```

## Build

Push a version tag and GitHub Actions builds every platform:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

## Roadmap

- [ ] Artist page
- [ ] Downloads and offline playback
- [ ] Playlists, history, subscriptions
- [ ] Background play and picture-in-picture

## Credits

Feature ideas come from these open-source projects:
[NouTube](https://github.com/nonbili/NouTube), [LibreTube](https://github.com/libre-tube/libretube), [Flow](https://github.com/Flow-Tube/Flow).
If you copy code from them, follow their licenses (LibreTube is GPL-3.0).

## Disclaimer

YouTube Pro is not affiliated with or endorsed by YouTube or Google.

## License

MIT. This project contains no code copied from the credited projects.
