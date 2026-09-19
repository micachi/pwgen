#!/usr/bin/env node
/**
 * 旧 pwgen リポジトリ — 統合先へのリダイレクト専用ページを生成する。
 * GitHub Pages はサーバ側 301 を持てないため、
 *   canonical（検索エンジン向け） + meta refresh + location.replace
 * の3点で移行を伝える。
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "dist");
const TARGET = "https://tools.wicachi.com/password/";

const page = (label) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=${TARGET}">
<link rel="canonical" href="${TARGET}">
<meta name="robots" content="noindex">
<title>${label} — 移動しました</title>
<style>body{background:#0d1017;color:#e6e9ee;font-family:"Hiragino Kaku Gothic ProN",Meiryo,system-ui,sans-serif;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;line-height:1.8}
.box{max-width:520px;padding:32px;text-align:center}
a{color:#4f9cff}</style>
</head>
<body>
<div class="box">
  <p><b>${label}</b> は統合により新しい場所へ引っ越しました。</p>
  <p>移動しない場合は <a href="${TARGET}">こちらをクリック</a> してください。</p>
</div>
<script>location.replace("${TARGET}");</script>
</body>
</html>`;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), page("パスワード一括生成"));
console.log("OK  リダイレクトページ生成 → dist/index.html ⇒ " + TARGET);
