// FB④ 回路テクスチャが Bloom 閾値(0.9)未満=発光しないことの保守的検証。
// canvas パッケージが無いので、"最も明るく描かれる色を、テクスチャ内で完全不透明(alpha=1)
// で敷き詰めた"最悪ケースを想定し、レンダリング後の linear 輝度が閾値を超えないか計算する。
// 実際は各要素の alpha は 0.08〜0.16 と低く、テクスチャ opacity(idle 0.32/hover 0.5)も
// 掛かるので、下の最悪ケースより遥かに暗い(=さらに安全)。
import * as THREE from 'three';
const THRESHOLD = 0.9;
const luma = (c) => 0.2126*c.r + 0.7152*c.g + 0.0722*c.b;

// makeCircuitTexture で使う最も明るい色。
const cool = new THREE.Color('#cfe3ff');                 // ドット/破線
const accents = ['#ff2d9c','#05d9e8','#b14dff','#ff9e2c','#1f8fff'];

// meshBasicMaterial(map, color=white, toneMapped 既定=有効)。
// テクスチャは SRGBColorSpace なので three は texel を sRGB->linear 変換して扱う。
// three.Color('#cfe3ff') は既に linear 値を保持している(THREE.Color は sRGB 入力を linear 化)。
// → material 出力 linear RGB の上限 = texelLinear * materialOpacity(color は白=1)。
//   さらに toneMapping(ACESFilmic 等)で通常は暗くなるが、ここでは掛けずに上限評価。
//
// 注: 実際に Bloom が見るのは "背景(暗いガラス)に alpha 合成された後" の HDR 画素。
//   テクスチャ alpha<1 なら背景(暗)が透けてさらに暗くなる。ここでは alpha=1 の最悪ケース。
const OPACITY = { idle: 0.3, hover: 0.42 };

let pass = true;
for (const state of ['idle','hover']) {
  const op = OPACITY[state];
  // 最悪色 = cool(最も明るい) と traceCol(cool.lerp(accent,0.35)) の明るい方。
  let worst = luma(cool);
  for (const a of accents) {
    const traceCol = cool.clone().lerp(new THREE.Color(a), 0.35);
    worst = Math.max(worst, luma(traceCol));
  }
  const rendered = worst * op; // color=白, toneMapped 無視の上限
  const ok = rendered < THRESHOLD;
  if (!ok) pass = false;
  console.log(`${state.padEnd(5)} opacity=${op}  worstTexelLinearLuma=${worst.toFixed(3)}  renderedUpperBound=${rendered.toFixed(3)}  ${ok?'<0.9 非発光 OK':'>=0.9 FAIL'}`);
}
// 参考: 実際の各要素の最大 alpha は 0.18(トレース/パッド)。それを掛けた"現実的上限"も表示。
const realAlpha = 0.18;
const realIdle = luma(cool)*realAlpha*OPACITY.idle;
console.log(`\n参考(現実的上限 alpha=${realAlpha} × opacity idle): rendered≈${realIdle.toFixed(4)}  <<0.9(実際はさらに暗い)`);
console.log('\n'+(pass?'=== 回路テクスチャ: 最悪ケースでも <0.9 非発光  PASS ✔':'=== 回路テクスチャ: FAIL ✗'));
process.exit(pass?0:1);
