const PG = require("./src/core.js");
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { pass++; console.log("  \x1b[32mPASS\x1b[0m " + name + (extra ? "  " + extra : "")); }
  else { fail++; console.log("  \x1b[31mFAIL\x1b[0m " + name + (extra ? "  " + extra : "")); }
};

console.log("\n=== 1. 文字プール / 除外条件 ===");
{
  const { pool, classes } = PG.buildPool({ upper: true, lower: true, digits: true, symbols: true });
  const expectPool = PG.SETS.upper.length + PG.SETS.lower.length + PG.SETS.digits.length + PG.SETS.symbols.length;
  ok("全選択でプール=各集合の合計", pool.length === expectPool, `pool=${pool.length} (期待値 ${expectPool})`);
  ok("クラス数=4", classes.length === 4);

  const a = PG.buildPool({ upper: true, lower: true, digits: true, symbols: true, excludeAmbiguous: true });
  ok("紛らわしい文字が除外されている", !/[il1Lo0O]/.test(a.pool), "pool=" + a.pool);

  const c = PG.buildPool({ upper: true, digits: true, excludeChars: "AO0" });
  ok("カスタム除外", !c.pool.includes("A") && !c.pool.includes("O") && !c.pool.includes("0"));

  const empty = PG.buildPool({});
  ok("全未選択ならプール0", empty.pool.length === 0);
}

console.log("\n=== 2. 生成の正当性 ===");
{
  const opt = { upper: true, lower: true, digits: true, symbols: true, length: 20, count: 500 };
  const list = PG.generateBatch(opt);
  ok("個数どおり", list.length === 500);
  ok("文字数どおり", list.every((p) => p.length === 20));
  ok("全角混入なし", list.every((p) => /^[\x21-\x7e]+$/.test(p)));

  const base = PG.buildPool(opt).pool;
  ok("プール外の文字なし", list.every((p) => [...p].every((ch) => base.includes(ch))));

  const allHave = ["upper", "lower", "digits", "symbols"].every((k) => {
    const set = PG.SETS[k];
    return list.every((p) => [...p].some((ch) => set.includes(ch)));
  });
  ok("各文字種が全件で最低1回出現", allHave);
}

console.log("\n=== 3. 一文字種 + 文字数不足のエラー ===");
{
  let threw = false;
  try { PG.generateOne(PG.makeRand(), { upper: true, lower: true, length: 1 }); } catch { threw = true; }
  ok("len < クラス数 で例外", threw);
  let threw2 = false;
  try { PG.generateOne(PG.makeRand(), { length: 12 }); } catch { threw2 = true; }
  ok("全未選択で例外", threw2);
}

console.log("\n=== 4. 乱数の均等性（バイアス検査） ===");
{
  const rand = PG.makeRand();
  const N = 600000, K = 7;
  const hist = new Array(K).fill(0);
  for (let i = 0; i < N; i++) hist[rand.int(K)]++;
  const exp = N / K;
  const chi2 = hist.reduce((s, h) => s + (h - exp) ** 2 / exp, 0);
  // 自由度6、有意水準0.1%の臨界値 22.46
  ok("int(7) カイ二乗検定 pass", chi2 < 22.46, `chi2=${chi2.toFixed(2)} (閾値22.46)`);
  ok("全バケット出現", hist.every((h) => h > 0), hist.join(","));

  // 2^32 を超える境界の近くでも壊れないか
  const big = rand.int(3000000000);
  ok("大きな n でも範囲内", big >= 0 && big < 3000000000);
}

console.log("\n=== 5. 一意性（重複してはいけない） ===");
{
  const list = PG.generateBatch({ upper: true, lower: true, digits: true, length: 16, count: 20000 });
  const uniq = new Set(list);
  ok("2万件で重複0", uniq.size === 20000, `uniq=${uniq.size}`);
}

console.log("\n=== 6. エントロピー計算 ===");
{
  const { classes } = PG.buildPool({ upper: true, lower: true, digits: true, symbols: true });
  const b = PG.entropyBits(20, classes);
  const naive = 20 * Math.log2(90);
  ok("厳密値は素朴値をやや下回る（=保証の分だけ正しい）", b < naive && b > naive - 1,
    `exact=${b.toFixed(2)} naive=${naive.toFixed(2)}`);

  const one = PG.entropyBits(12, PG.buildPool({ digits: true }).classes);
  ok("数字12桁 = 39.86bit", Math.abs(one - 39.863) < 0.01, one.toFixed(3));

  ok("短すぎると保証不可能で低下", PG.entropyBits(1, classes) < 7);
}

console.log("\n=== 7. オプションの挙動 ===");
{
  const lf = PG.generateBatch({ upper: true, lower: true, digits: true, symbols: true, length: 16, count: 400, letterFirst: true });
  ok("先頭が英字のみ", lf.every((p) => /^[A-Za-z]/.test(p)));

  const nr = PG.generateBatch({ upper: true, lower: true, digits: true, symbols: true, length: 12, count: 400, noRepeat: true });
  ok("連続同一文字なし", nr.every((p) => !/(.)\1/.test(p)));

  const amb = PG.generateBatch({ upper: true, lower: true, digits: true, symbols: true, length: 24, count: 300, excludeAmbiguous: true });
  ok("除外文字が1つも出ない", amb.every((p) => !/[il1Lo0O]/.test(p)));
}

console.log("\n=== 8. crackTime 表示 ===");
{
  ok("40bit = 秒〜分オーダー", PG.crackTime(40).length > 0, PG.crackTime(40));
  ok("120bit = 事実上不可能", PG.crackTime(128).includes("不可能"), PG.crackTime(128));
  ok("0bit でクラッシュしない", typeof PG.crackTime(0) === "string", PG.crackTime(0));
}

console.log(`\n---- ${pass} passed, ${fail} failed ----\n`);
process.exit(fail ? 1 : 0);
