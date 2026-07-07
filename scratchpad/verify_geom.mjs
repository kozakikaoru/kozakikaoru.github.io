// HUD 全ジオメトリ(hud/hudGeometry の実コード)の健全性チェック:
//   全頂点が有限(NaN なし)/ 頂点数 > 0 / body の bbox がパネル実寸と一致・z 中心化・
//   シルエットが outline と一致(監査[Med]で確立した不変)を、実モジュールを import して確認。
import * as THREE from 'three';
import { PANEL_SIZES } from '../src/data/panels.ts';
import {
  makeCutBodyGeometry,
  makeCutOutlineGeometry,
  makeCutFrameGeometry,
  makeOuterBracketsGeometry,
  makeRegistrationMarksGeometry,
  makeConnectorNubsGeometry,
  makeScaleTicksGeometry,
  makeIconGeometry,
  makeRingTicksGeometry,
  makeOrbitDotsGeometry,
  // ※ seam/divider/arrow は D で撤去したので import しない。
} from '../src/three/hud/hudGeometry.ts';

const PANEL_D = 0.12;
let ok = true;

function noNaN(name, geo, needIndex = false) {
  const pos = geo.getAttribute('position');
  let nan = 0;
  for (let i = 0; i < pos.count; i++) {
    if (!isFinite(pos.getX(i)) || !isFinite(pos.getY(i)) || !isFinite(pos.getZ(i))) nan++;
  }
  const idx = geo.index ? geo.index.count : 0;
  const good = nan === 0 && pos.count > 0 && (!needIndex || idx > 0);
  if (!good) ok = false;
  console.log(`  ${name.padEnd(28)} verts=${String(pos.count).padStart(4)} idx=${String(idx).padStart(4)} nan=${nan} ${good ? 'OK' : 'FAIL'}`);
  geo.dispose();
}

for (const [size, dim] of Object.entries(PANEL_SIZES)) {
  const isLarge = size === 'lg';
  const r = isLarge ? 0.13 : 0.1;
  const cut = isLarge ? 0.34 : 0.26;
  const w = dim.w, h = dim.h;
  const ringR = isLarge ? 0.3 : 0.24;
  console.log(`\n== ${size} ${w}x${h} (r=${r} cut=${cut}) ==`);

  // body: bbox==size, z 中心化, シルエット一致。
  const body = makeCutBodyGeometry(w, h, PANEL_D, r, cut);
  body.computeBoundingBox();
  const bb = body.boundingBox;
  const bx = bb.max.x - bb.min.x, by = bb.max.y - bb.min.y, bz = bb.max.z - bb.min.z;
  const op = new THREE.Shape();
  // outline の範囲は makeCutOutlineGeometry の bbox で測る。
  const outline = makeCutOutlineGeometry(w, h, r, cut);
  outline.computeBoundingBox();
  const ob = outline.boundingBox;
  const sil = Math.abs((ob.max.x - ob.min.x) - bx) < 1e-4 && Math.abs((ob.max.y - ob.min.y) - by) < 1e-4;
  const bodyGood = Math.abs(bx - w) < 1e-4 && Math.abs(by - h) < 1e-4 && Math.abs(bz - PANEL_D) < 1e-4 &&
    Math.abs(bb.max.z - PANEL_D / 2) < 1e-4 && sil;
  if (!bodyGood) ok = false;
  console.log(`  ${'body'.padEnd(28)} bbox=${bx.toFixed(3)}x${by.toFixed(3)}x${bz.toFixed(3)} silhouette==outline=${sil} ${bodyGood ? 'OK' : 'FAIL'}`);
  body.dispose(); outline.dispose();
  void op;

  noNaN('outline', makeCutOutlineGeometry(w, h, r, cut));
  // E: frame 面の border を 0.012 に極細化(実装 GlassPanel と一致)。
  noNaN('frame(穴あき・極細)', makeCutFrameGeometry(w - 0.06, h - 0.06, 0.012, r, cut), true);
  noNaN('brackets(二重L+端点)', makeOuterBracketsGeometry(w, h, isLarge ? 0.44 : 0.34, 0.1));
  noNaN('reg-marks', makeRegistrationMarksGeometry(w, h));
  noNaN('nubs', makeConnectorNubsGeometry(w, h, 0.12, 0.03));
  noNaN('ticks', makeScaleTicksGeometry(w, h, isLarge ? 16 : 10));
  noNaN('ring-ticks', makeRingTicksGeometry(ringR, isLarge ? 36 : 28));
  noNaN('orbit-dots', makeOrbitDotsGeometry(ringR, 3));
}

// アイコン 5 種すべて。
console.log('\n== icons ==');
for (const kind of ['profile', 'skills', 'gallery', 'route', 'signal']) {
  noNaN(`icon:${kind}`, makeIconGeometry(kind, 0.28));
}

console.log('\n' + (ok ? 'GEOM: 全ジオメトリ有限・非退化・body bbox==size・シルエット一致 ✔' : 'GEOM: FAIL ✗'));
process.exit(ok ? 0 : 1);
