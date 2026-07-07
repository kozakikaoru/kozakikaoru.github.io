// 装飾の実はみ出し量が DECOR_MARGIN(0.2)以内であることを、実ジオメトリで測る。
// 枠外へ張り出す全装飾(guide 輪郭 / 二重 L ブラケット+端点 / nub / ブラケット端点)の
// 頂点を生成し、パネル外形(±w/2, ±h/2)からの最大はみ出しを計算する。
// これが DECOR_MARGIN を超えると非重複の数式保証(panels.ts)が崩れる。
// ※ ①後: L ブラケットは TR+BL の 2 隅のみ生成(DECOR_CORNERS)。頂点走査なので
//   隅が減ってもこのスクリプトは自動追従する(はみ出し最大値は nub の 0.15 で不変)。
import { DECOR_MARGIN, PANEL_SIZES } from '../src/data/panels.ts';
import {
  makeOuterBracketsGeometry,
  makeConnectorNubsGeometry,
  makeCutOutlineGeometry,
} from '../src/three/hud/hudGeometry.ts';

const BRACKET_OUT = 0.1;
const NUB_LEN = 0.12;
const NUB_TIP = 0.03;

// GlassPanel の実際の呼び出しに合わせる。
function overhangFor(w, h, isLarge) {
  const geoms = [
    // guide 輪郭(最外): PANEL_W+0.1, PANEL_H+0.1(半分 = +0.05 はみ出す)。
    makeCutOutlineGeometry(w + 0.1, h + 0.1, (isLarge?0.13:0.1)+0.02, (isLarge?0.34:0.26)+0.04),
    // 二重 L ブラケット + 端点(枠外 BRACKET_OUT)。
    makeOuterBracketsGeometry(w, h, isLarge?0.44:0.34, BRACKET_OUT),
    // コネクタ nub(枠外 NUB_LEN + 端点 NUB_TIP)。
    makeConnectorNubsGeometry(w, h, NUB_LEN, NUB_TIP),
  ];
  const hw = w/2, hh = h/2;
  let maxOver = 0;
  for (const g of geoms) {
    const pos = g.getAttribute('position');
    for (let i=0; i<pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const ox = Math.max(0, Math.abs(x) - hw);
      const oy = Math.max(0, Math.abs(y) - hh);
      maxOver = Math.max(maxOver, ox, oy);
    }
    g.dispose();
  }
  return maxOver;
}

let pass = true;
console.log(`DECOR_MARGIN = ${DECOR_MARGIN}`);
for (const [size, dim] of Object.entries(PANEL_SIZES)) {
  const isLarge = size === 'lg';
  // 通常 + column 圧縮(lg×0.84)も測る。
  const cases = isLarge ? [[dim.w, dim.h, 'full'],[dim.w*0.84, dim.h*0.84, 'column']] : [[dim.w, dim.h, 'full']];
  for (const [w,h,tag] of cases) {
    const over = overhangFor(w, h, isLarge);
    const ok = over <= DECOR_MARGIN + 1e-6;
    if (!ok) pass = false;
    console.log(`  ${size}/${tag.padEnd(6)} ${w.toFixed(2)}x${h.toFixed(2)}  maxOverhang=${over.toFixed(4)}  (<= ${DECOR_MARGIN} ${ok?'OK':'FAIL'})`);
  }
}
console.log('\n'+(pass?'=== 全装飾のはみ出し <= DECOR_MARGIN(非重複保証を維持)  PASS ✔':'=== はみ出し超過  FAIL ✗'));
process.exit(pass?0:1);
