// 発光リードアウト層(hud/hudTextures.makeGlowTexture)の輝度機構検証。
// 機構: テクスチャは白マスク(sRGB 白 = texel linear 1.0)、material は
//   meshBasicMaterial { map, color=neonColor(accent, target), toneMapped:false, transparent }。
//   → 画素出力(linear) = texelLinear(白部分≈1) × colorLinear、alpha ブレンドで
//     背景(暗いガラス)と合成される: out = white*color*alpha + bg*(1-alpha)。
//
// 検証したいこと:
//   1) "明るいリードアウト"(status/bars/progress: ink alpha 0.85〜1.0)は閾値 0.9 を超えて発光。
//   2) idle では "淡いリードアウト"(axis 0.55 等)は閾値未満に留まり、ノイズ的に光り
//      散らからない(accent 色の細部として見えるだけ)= 上品な密度。
//      ※ hover は "選択中" の状態なので全体が明るくなってよい(淡ラインも一緒に持ち上がる)。
//        散らかり回避が最重要なのは休息状態=idle なので、dim<0.9 の縛りは idle にのみ課す。
//   3) 全 accent で 1) が成立(色相非依存)。
import * as THREE from 'three';
const THRESHOLD = 0.9;
const luma = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
function neonColor(base, targetLuma, cap = 12) {
  const l = luma(base);
  const k = l > 1e-4 ? targetLuma / l : targetLuma;
  return base.clone().multiplyScalar(Math.min(k, cap));
}
const accents = { about:'#ff2d9c', services:'#05d9e8', works:'#b14dff', career:'#ff9e2c', contact:'#1f8fff' };
// 背景 = 暗いガラス(glassTint)。合成の暗側。
function glassTint(hex){ return new THREE.Color(hex).lerp(new THREE.Color('#0b1a2a'),0.78); }

// makeGlowTexture 内の主な ink alpha。
const INKS = [
  ['status タグ',      1.00, true],
  ['bars/grid 塗り',   0.85, true],
  ['progress 充填',    0.90, true],
  ['barcode',          0.85, true],
  ['caption 文字',     0.90, true],
  ['sub-readout 文字', 0.85, true],
  ['chart 軸(淡)',    0.55, false], // 淡ディテール: 閾値未満でよい
  ['grid 枠(淡)',     0.60, false],
];
// idle/hover の readoutColor ターゲット(GlassPanel と一致)。
const TARGET = { idle: 1.3, hover: 1.9 };

let pass = true;
for (const state of ['idle','hover']) {
  const tgt = TARGET[state];
  console.log(`\n== ${state}  readoutColor target=${tgt} ==`);
  for (const [name,hex] of Object.entries(accents)) {
    const base = new THREE.Color(hex);
    const col = neonColor(base, tgt);       // HDR material.color(linear)
    const bg = glassTint(hex);              // 背景(暗)
    let brightOk = true, dimOk = true;
    for (const [, alpha, mustGlow] of INKS) {
      // out = texel(白=1) * color * alpha + bg * (1-alpha)
      const out = col.clone().multiplyScalar(alpha).add(bg.clone().multiplyScalar(1-alpha));
      const L = luma(out);
      const over = L >= THRESHOLD;
      if (mustGlow && !over) brightOk = false;
      // 淡ラインが光ってしまうと散らかる → ただし縛るのは idle のみ(hover は選択中で明るくてよい)。
      if (!mustGlow && over && state === 'idle') dimOk = false;
    }
    if (!brightOk || !dimOk) pass = false;
    // 代表 2 値を表示。
    const brightL = luma(col.clone().multiplyScalar(1.0).add(bg.clone().multiplyScalar(0)));
    const dimAlpha = 0.55;
    const dimL = luma(col.clone().multiplyScalar(dimAlpha).add(bg.clone().multiplyScalar(1-dimAlpha)));
    console.log(`  ${name.padEnd(9)} bright(alpha1)=${brightL.toFixed(3)}${brightL>=THRESHOLD?'>=0.9 発光':'<0.9'} `+
      `dim(axis)=${dimL.toFixed(3)}${dimL>=THRESHOLD?'>=0.9':'<0.9 淡'}  ${brightOk&&dimOk?'OK':'FAIL'}`);
  }
}
console.log('\n'+(pass
  ? '=== 発光リードアウト: 明るいリードアウト>=0.9 発光 / 淡ライン<0.9(散らからない) / 全 accent  PASS ✔'
  : '=== 発光リードアウト: FAIL ✗'));
process.exit(pass?0:1);
