// 非重複の数式検証: 全アスペクト比で findOverlaps が空(=装飾込みでも重ならない)。
// panels.ts を Node 22 の型ストリップで直接読む(実コードで検証)。
import { layoutForAspect, findOverlaps, DECOR_MARGIN, PANEL_SIZES } from '../src/data/panels.ts';

// 代表アスペクト比(wide/portrait/column を網羅) + 極端値。
const aspects = [
  2.4, 2.0, 1.78, 1.5, 1.3, 1.16, 1.15, 1.14, // wide 境界前後
  1.0, 0.8, 0.63, 0.62, 0.61, // portrait 境界前後
  0.5, 0.42, 0.33, // column
];

console.log('DECOR_MARGIN =', DECOR_MARGIN, ' md=', JSON.stringify(PANEL_SIZES.md), ' lg=', JSON.stringify(PANEL_SIZES.lg));
let allOk = true;
// 各レイアウトで、装飾込み(2*DECOR_MARGIN)分離が全ペア成立するか。
// さらに「最小の実クリアランス」を出して、はみ出し(<=DECOR_MARGIN/側)でも触れないことを数値で示す。
for (const a of aspects) {
  const layout = layoutForAspect(a, 42);
  const bad = findOverlaps(layout); // pairSeparated が 2*DECOR_MARGIN 込みで判定
  const ids = Object.keys(layout.positions);
  // 最小クリアランス(分離方向での「素のパネル間の隙間」)を計算。
  let minGapBare = Infinity;
  for (let i=0;i<ids.length;i++) for (let j=i+1;j<ids.length;j++){
    const A=ids[i],B=ids[j];
    const [ax,ay]=layout.positions[A],[bx,by]=layout.positions[B];
    const dx=Math.abs(ax-bx), dy=Math.abs(ay-by);
    const gapX=dx-(layout.sizes[A].w/2+layout.sizes[B].w/2);
    const gapY=dy-(layout.sizes[A].h/2+layout.sizes[B].h/2);
    // 分離している方向(正の隙間)の最大が、そのペアの実クリアランス。
    const clearance=Math.max(gapX,gapY);
    if (clearance<minGapBare) minGapBare=clearance;
  }
  const ok = bad.length===0;
  allOk = allOk && ok;
  console.log(
    `aspect ${a.toFixed(2)} kind=${layout.kind.padEnd(8)} overlaps=${bad.length===0?'none':JSON.stringify(bad)}`,
    ` minBareClearance=${minGapBare.toFixed(3)} (need>=2*DM=${(2*DECOR_MARGIN).toFixed(2)}) => ${minGapBare>=2*DECOR_MARGIN-1e-9?'OK':'FAIL'}`
  );
}
console.log(allOk ? '\nALL LAYOUTS: no overlaps with decoration margin ✔' : '\nOVERLAP DETECTED �’✗');
process.exit(allOk?0:1);
