// ③ 新 ABOUT 高さでのレイアウト健全性: column lg の実効サイズ / 各アスペクトの cameraZ を確認。
import { layoutForAspect, PANEL_SIZES, COLUMN_LG_PANEL_SCALE } from '../src/data/panels.ts';

const lg = PANEL_SIZES.lg, md = PANEL_SIZES.md;
console.log('lg=', JSON.stringify(lg), ' md=', JSON.stringify(md));
console.log('column lg 実効 =', (lg.w*COLUMN_LG_PANEL_SCALE).toFixed(2), 'x', (lg.h*COLUMN_LG_PANEL_SCALE).toFixed(2),
  ' (md比 w', (lg.w*COLUMN_LG_PANEL_SCALE/md.w).toFixed(2), '/ h', (lg.h*COLUMN_LG_PANEL_SCALE/md.h).toFixed(2), ')');
console.log('\naspect  kind      cameraZ  cameraY');
for (const a of [2.0, 1.5, 1.16, 1.0, 0.62, 0.42]) {
  const L = layoutForAspect(a, 42);
  console.log(`${a.toFixed(2).padStart(5)}  ${L.kind.padEnd(8)}  ${L.cameraZ.toFixed(2).padStart(6)}  ${L.cameraY.toFixed(2).padStart(6)}`);
}
