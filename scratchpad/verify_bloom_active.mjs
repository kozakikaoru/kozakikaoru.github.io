// hover(active)時の発光輝度検証。全発光要素が余裕で閾値 0.9 超、本体は未満、hover>idle。
import * as THREE from 'three';
const THRESHOLD = 0.9;
const luma = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
function neonColor(base, targetLuma, cap = 12) {
  const l = luma(base);
  const k = l > 1e-4 ? targetLuma / l : targetLuma;
  return base.clone().multiplyScalar(Math.min(k, cap));
}
const accents = { about:'#ff2d9c', services:'#05d9e8', works:'#b14dff', career:'#ff9e2c', contact:'#1f8fff' };
// [label, hoverTarget, idleTarget, soft]  soft=true は淡装飾(閾値未満でよい)。
const GLOW = [
  ['rim(前面)',2.2,1.15],['inner-rim',1.5,1.0],['frame',1.9,1.05],['bracket',2.8,1.6],
  ['reg-mark',1.6,1.05],['nub',1.8,1.1],['tick',1.55,1.05],['ring',2.1,1.25],['ring-tick',1.7,1.1],
  ['icon',2.2,1.35],['arrow',2.3,1.45],['label',2.2,1.3],['readout',1.9,1.3],['scan',1.5,1.15],
  ['guide',1.1,0.55,true],['seam',1.2,0.7,true],['divider',1.4,0.85,true],['rim(背面)',1.3,0.5,true],
];
function glassTint(hex){ return new THREE.Color(hex).lerp(new THREE.Color('#0b1a2a'),0.78); }
let pass = true;
for (const [name,hex] of Object.entries(accents)){
  const base = new THREE.Color(hex);
  let allOver = true, hoverGtIdle = true;
  for (const [, tH, tI, soft] of GLOW){
    const LH = luma(neonColor(base,tH));
    const LI = luma(neonColor(base,tI));
    if (!soft && LH < THRESHOLD) allOver=false;
    if (LH <= LI + 1e-6) hoverGtIdle=false;
  }
  const bodyL = luma(glassTint(hex));
  const bodyOk = bodyL < THRESHOLD;
  if (!allOver || !bodyOk || !hoverGtIdle) pass=false;
  const minGlow = Math.min(...GLOW.filter(([,,,soft])=>!soft).map(([,t])=>luma(neonColor(base,t))));
  console.log(`${name.padEnd(9)} minMainGlow=${minGlow.toFixed(3)} (>=0.9 ${allOver?'OK':'FAIL'})  hover>idle ${hoverGtIdle?'OK':'FAIL'}  body=${bodyL.toFixed(3)} (<0.9 ${bodyOk?'OK':'FAIL'})`);
}
console.log('\n'+(pass?'=== HOVER: 主要ライン+リードアウト>=0.9 / hover>idle / 本体<0.9  PASS ✔':'=== HOVER: FAIL ✗'));
process.exit(pass?0:1);
