#!/usr/bin/env node
/** 単一HTMLにインライン化 → dist/index.html（オフライン動作対応） */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");

const css = readFileSync(join(SRC, "style.css"), "utf8");
const core = readFileSync(join(SRC, "core.js"), "utf8");
const app = readFileSync(join(SRC, "app.js"), "utf8");
let html = readFileSync(join(SRC, "index.html"), "utf8");

// </script> を含むと HTML パーサが壊れるので防御
const safe = (s) => s.replace(/<\/script>/gi, "<\\/script>");

html = html.replace("/*@STYLE*/", () => css)
           .replace("/*@CORE*/", () => safe(core))
           .replace("/*@APP*/", () => safe(app));

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
writeFileSync(join(OUT, "CNAME"), "");

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`OK  単一HTML生成 → dist/index.html (${kb} KB)`);
