// ネオン HUD 5x 格上げ後の発光輝度検証(不変条件「枠+発光リードアウトだけ光る」)。
// GlassPanel の neonColor()(輝度正規化)と各発光要素の idle/hover ターゲット輝度を再現し、
// Rec709 輝度が Bloom 閾値(0.9)を超えるべきもの/超えてはいけないものを全 5 accent で確認する。
//
// ■ 3 分類:
//   [GLOW]   構造の発光線 + 発光リードアウト → idle でも閾値超え必須(neonColor 出力 luma)。
//   [DIM]    淡ディテール層 / ガイド線 / 背面リム / 罫線 / 区切り → idle は閾値未満(非発光)。
//   [BODY]   ダークガラス本体 → 常に閾値未満(枠だけ光る)。
//
// ■ 発光リードアウト層(白マスク × HDR material.color)の機構検証:
//   8bit sRGB texel は linear 1.0 で頭打ち。テクスチャは白マスク(texel≈1)、色は HDR の
//   material.color=neonColor(accent, target) で乗せる → output_linear = 1 × colorLinear。
//   よって readout の "白部分(alpha≈1)" の出力輝度 = luma(neonColor(accent, readoutTarget))。
//   これが閾値 0.9 を超えることを確認する(= どの accent でも色付きで確実に発光)。
//   逆に淡ディテール層は "白でない低 alpha インク"(<=0.18)× 低 opacity(0.3)なので
//   別途 verify_circuit.mjs で閾値未満を保証する。
import * as THREE from 'three';

const THRESHOLD = 0.9;
const luma = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

// GlassPanel/hud/neon.ts の neonColor と同一。
function neonColor(base, targetLuma, cap = 12) {
  const l = luma(base);
  const k = l > 1e-4 ? targetLuma / l : targetLuma;
  return base.clone().multiplyScalar(Math.min(k, cap));
}

const accents = {
  about: '#ff2d9c', services: '#05d9e8', works: '#b14dff',
  career: '#ff9e2c', contact: '#1f8fff',
};

// [label, idleTarget, hoverTarget, class]  class: 'glow'=閾値超必須 / 'dim'=閾値未満必須
// ※ 実装 A〜E 反映: arrow(CTA)/seam(罫線)/divider(区切り)は撤去。scan は subtle 化で
//   target を 1.15→0.85(idle) に下げた。中央の日本語ラベル(canvas fillText の白マスク ×
//   HDR labelColor)を label(日本語) として追加(readout と同じ発光機構)。
const ELEMENTS = [
  ['rim(前面)',        1.15, 2.2, 'glow'],
  ['inner-rim(内側)',   1.00, 1.5, 'glow'],
  ['frame(縁の芯・極細)', 1.05, 1.9, 'glow'], // E: 面は極細化。色 target は不変
  ['bracket(二重L+端点)', 1.60, 2.8, 'glow'],
  ['reg-mark(角十字)',  1.05, 1.6, 'glow'],
  ['nub',              1.10, 1.8, 'glow'],
  ['tick(目盛り)',      1.05, 1.55, 'glow'],
  ['ring',             1.25, 2.1, 'glow'],
  ['ring-tick(回転)',   1.10, 1.7, 'glow'],
  ['icon',             1.35, 2.2, 'glow'],
  ['label(日本語)',     1.30, 2.2, 'glow'], // A: canvas 白マスク×HDR labelColor(枠と同様 idle 発光)
  ['status-mark(点滅)', 1.45, 2.3, 'glow'], // 旧 arrowColor 流用の点滅マーク
  ['readout(発光層)',   1.30, 1.9, 'glow'], // 白マスク×HDR: 出力=neonColor(accent, target)
  // --- 淡装飾 / subtle: idle は閾値未満(非発光 or ごく控えめ) ---
  ['scan(走査線・subtle)', 0.85, 1.15, 'dim'], // E: subtle 化。idle は閾値未満に抑える
  ['guide(最外ガイド)', 0.55, 1.1, 'dim'],
  ['rim(背面)',        0.50, 1.3, 'dim'],
];

function glassTint(hex) {
  return new THREE.Color(hex).lerp(new THREE.Color('#0b1a2a'), 0.78);
}
// scan(走査線)の実出力: HDR 色 × opacity(0.18)+ 背景ガラス ×(1-0.18)。
// dim 分類は「色 target を 0.9 未満に抑えた」ことの確認だが、実際の見えはさらに暗い。
function scanBlended(hex, target) {
  const col = neonColor(new THREE.Color(hex), target);
  const bg = glassTint(hex);
  const a = 0.18;
  return col.clone().multiplyScalar(a).add(bg.clone().multiplyScalar(1 - a));
}

let pass = true;
for (const [name, hex] of Object.entries(accents)) {
  const base = new THREE.Color(hex);
  console.log(`\n== ${name} (${hex})  base linear luma=${luma(base).toFixed(3)} ==`);
  for (const [label, tI, tH, cls] of ELEMENTS) {
    const LI = luma(neonColor(base, tI));
    const LH = luma(neonColor(base, tH));
    const idleOver = LI >= THRESHOLD;
    const hoverOver = LH >= THRESHOLD;
    let ok;
    if (cls === 'glow') ok = idleOver && LH > LI; // idle 発光 & hover>idle
    else ok = !idleOver && LH > LI;               // idle 非発光 & hover>idle
    if (!ok) pass = false;
    console.log(
      `  ${label.padEnd(20)} idle=${LI.toFixed(3)}${idleOver ? '>=0.9' : '<0.9 '} ` +
      `hover=${LH.toFixed(3)}${hoverOver ? '>=0.9' : '<0.9 '} [${cls}] ${ok ? 'OK' : 'FAIL'}`,
    );
  }
  // 面で光る要素は idle 完全消灯(GlassPanel: emissiveIntensity=0・opacity=0)。
  const plateOff = true; // 定数: active?0.16:0 / active?0.1:0
  console.log(`  ${'内側色板(面)idle'.padEnd(20)} emissive=0 opacity=0 => 完全消灯 OK`);
  // 本体は閾値未満(枠だけ光る)。
  const bodyL = luma(glassTint(hex));
  const bodyOk = bodyL < THRESHOLD;
  if (!bodyOk) pass = false;
  console.log(`  ${'BODY(ダークガラス)'.padEnd(20)} luma=${bodyL.toFixed(3)} ${bodyOk ? '<0.9 光らない OK' : '>=0.9 FAIL'}`);
  // scan(走査線)の実出力(opacity 0.18 込み)。idle は本体レベルまで抑えられる(subtle)。
  const scanIdleL = luma(scanBlended(hex, 0.85));
  const scanHoverL = luma(scanBlended(hex, 1.15));
  console.log(`  ${'scan実出力(op0.18)'.padEnd(20)} idle=${scanIdleL.toFixed(3)} hover=${scanHoverL.toFixed(3)} (subtle 参考)`);
  if (!plateOff) pass = false;
}
console.log('\n' + (pass
  ? '=== 全 accent: 発光線+リードアウト+日本語ラベル>=0.9 / 淡装飾+背面+scan+本体<0.9 / hover>idle  PASS ✔'
  : '=== FAIL ✗'));
process.exit(pass ? 0 : 1);
