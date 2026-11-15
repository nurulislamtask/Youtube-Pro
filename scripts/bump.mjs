// Usage: npm run bump -- 0.2.0
// Updates the version in package.json, tauri.conf.json and Cargo.toml, so a push builds and publishes that release.
import { readFileSync, writeFileSync } from "node:fs";

const v = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(v || "")) {
  console.error("Give a version like 0.2.0");
  process.exit(1);
}

const edit = (file, fn) => writeFileSync(file, fn(readFileSync(file, "utf8")));
edit("package.json", (t) => t.replace(/"version": "[^"]+"/, `"version": "${v}"`));
edit("src-tauri/tauri.conf.json", (t) => t.replace(/"version": "[^"]+"/, `"version": "${v}"`));
edit("src-tauri/Cargo.toml", (t) => t.replace(/^version = "[^"]+"/m, `version = "${v}"`));
console.log(`Version set to ${v}. Now: git commit -am "Release ${v}" && git push`);
