// 中央クリアゾーン検証(実装 A〜E 反映版・3 部構成)。
//
//  PART 1: 中央の日本語ラベル plane(A: canvas fillText テクスチャの貼り先)+ キャプション
//          + 左リングが、中央クリアゾーン帯(CLEAR_ZONE)に v 方向で内包されることを、
//          UV(=world)座標で確認する。ラベルは旧 drei Text(panel.sub)から
//          専用 plane(label.cx/cy/planeW/planeH)に変わったので、その矩形で判定する。
//          → 帯の外(上下ストリップ)にリードアウトを置けば、ラベル plane とも v で必ず分離。
//
//  PART 2: makeGlowTexture の新配置(上ストリップ/下ストリップ・rs 縮小・四隅底揃え)で
//          描かれる全リードアウトの y ピクセル範囲を、生成側と同じ式(定数・rs 込み)で
//          再現し、どれも中央帯 [clearTopY, clearBotY] に侵入せず・下端もはみ出さないことを assert。
//
//  PART 3: 下ストリップ 3 カラム(チャート/統計/バーコード)の水平非重複(同 y 帯のため)。
//
// 座標対応: glowTexture plate = planeGeometry(PANEL_W*0.92, PANEL_H*0.92)。
//   texU=0 → worldX=-0.46*PANEL_W, texV=0(上) → worldY=+0.46*PANEL_H。
//   UV: u=texX/w(左→右), v=texY/h(上→下)。world 変換は plate 倍率 0.92 で割る。

import { PANEL_SIZES, PANELS } from '../src/data/panels.ts';
import { HUD_THEMES } from '../src/three/hud/hudTheme.ts';

// CLEAR_ZONE は hudTextures.ts が three を巻き込むため import せず、値を複製する。
// hudTextures.ts の export const CLEAR_ZONE と一致させること(変えたら両方直す)。
const CLEAR_ZONE = {
  lg: { top: 0.27, bot: 0.655 },
  md: { top: 0.18, bot: 0.7 },
};

// hudTextures.ts の BAR_BOOST と一致させる(③ バーコード/ゲージ専用拡大係数)。
const BAR_BOOST = 1.25;

const PLATE = 0.92;
const GLYPH_H = 7; // 5x7 フォント行高(セル)
const DISPLAY = Object.fromEntries(PANELS.map((p) => [p.id, p.displayLabel]));

// ---- (A) 中央ラベル plane の配置(GlassPanel.tsx の label useMemo と一致)----
function labelPlane(isLarge, PANEL_W) {
  const ringR = isLarge ? 0.3 : 0.24;
  const ringCX = -PANEL_W / 2 + 0.5;
  const marginR = isLarge ? 0.4 : 0.3;
  const left = ringCX + ringR + 0.28;
  const right = PANEL_W / 2 - marginR;
  const planeW = Math.max(0.5, right - left);
  const planeH = isLarge ? 0.62 : 0.46;
  const cx = left + planeW / 2;
  const cy = isLarge ? 0.16 : 0.12;
  return { planeW, planeH, cx, cy, ringR };
}
// キャプション(caption)の配置(GlassPanel.tsx と一致: ②後 = ラベル plane 下・左寄せ)。
// x はラベル文字の視覚左端(plane 左端 + LABEL_TEX_PAD*planeW)に合わせ anchorX=left。
const LABEL_TEX_PAD = 0.03; // makeLabelTexture の左パディング割合(GlassPanel と一致)
function captionLayout(isLarge, lp) {
  const fs = isLarge ? 0.11 : 0.088;
  const y = lp.cy - lp.planeH / 2 - (isLarge ? 0.12 : 0.09);
  const leftX = lp.cx - lp.planeW / 2 + lp.planeW * LABEL_TEX_PAD; // 左端 anchor
  // ②後: 左寄せで長い md キャプションが右端を割らないよう字間を詰める(GlassPanel と一致)。
  const ls = isLarge ? 0.06 : 0.03;
  return { leftX, y, fs, ls };
}
const ADV_EM = 0.62, CAP_HALF_EM = 0.62;
function captionWorldBBox(text, leftX, y, fs, ls) {
  // anchorX=left: leftX から右へ総幅 w ぶん伸びる(左端固定)。
  const n = text.length;
  const w = n * ADV_EM * fs + Math.max(0, n - 1) * ls;
  return { x0: leftX, x1: leftX + w, yTop: y + CAP_HALF_EM * fs, yBot: y - CAP_HALF_EM * fs };
}
function worldToUV(x, y, PANEL_W, PANEL_H) {
  const halfW = (PANEL_W * PLATE) / 2, halfH = (PANEL_H * PLATE) / 2;
  return { u: (x + halfW) / (PANEL_W * PLATE), v: (halfH - y) / (PANEL_H * PLATE) };
}
function texDim(w, h) {
  const long = 1024, ar = w / h;
  return ar >= 1 ? { tw: long, th: Math.round(long / ar) } : { tw: Math.round(long * ar), th: long };
}

// ==================================================================
// PART 2: makeGlowTexture の新レイアウトが描く各要素の y ピクセル範囲を再現。
//   hudTextures.ts の placement 式と厳密に一致させること(定数・rs も同じ)。
//   返り値: [{name, yMin, yMax}]。yMin/yMax はテクスチャ px(0=上, h=下)。
// ==================================================================
function drawnExtents(theme, w, h, isLarge) {
  const zone = isLarge ? CLEAR_ZONE.lg : CLEAR_ZONE.md;
  const clearTopY = zone.top * h;
  const clearBotY = zone.bot * h;
  const pad = Math.round(w * 0.04); // ← 実装と一致(旧 0.05 から修正)
  const stripGap = Math.round(h * 0.02);
  const rs = isLarge ? 0.7 : 0.5; // ← C: リードアウト縮小率
  const txt = Math.max(0.8, (w / 300) * rs);
  const txtSm = Math.max(0.8, (w / 360) * rs);
  const ext = [];
  const add = (name, yMin, yMax) => ext.push({ name, yMin, yMax });

  // ---- 上ストリップ ----
  {
    const px = Math.max(1.2, (w / 300) * rs);
    const framePad = px * 2;
    add('status枠', pad, pad + GLYPH_H * px + framePad * 2);
    add('statusタグ文字', pad + framePad, pad + framePad + GLYPH_H * px);
    add('点滅ドット', pad + framePad, pad + framePad + px * 2);
    const codeY = pad + GLYPH_H * px + framePad * 2 + Math.round(h * 0.015);
    if (codeY + GLYPH_H * txtSm <= clearTopY - stripGap) add('seriesCode', codeY, codeY + GLYPH_H * txtSm);
    add('subReadout', pad + txt, pad + txt + GLYPH_H * txt);
  }

  // ---- 下ストリップ(C 縮小・D 底揃え四隅寄せ) ----
  const lowerTop = clearBotY + stripGap;
  const lowerBot = h - pad;
  const lowerSpan = lowerBot - lowerTop;
  {
    // ミニチャート(左下角・底揃え)+ 単位。
    const unitH = GLYPH_H * txtSm;
    const unitGap = Math.round(h * 0.01);
    const chartH = Math.max(8, Math.round(lowerSpan * 0.62 * rs));
    const chartY = lowerBot - unitH - unitGap - chartH;
    add('チャート', chartY, chartY + chartH);
    const unitY = chartY + chartH + unitGap;
    add('単位ラベル', unitY, unitY + unitH);
  }
  {
    // 統計小行(hexRows)。
    const rowStep = GLYPH_H * txtSm + Math.round(h * 0.012);
    theme.hexRows.slice(0, 3).forEach((row, i) => {
      const ry = lowerTop + i * rowStep;
      if (ry + GLYPH_H * txtSm <= lowerBot) add(`hexRow${i}`, ry, ry + GLYPH_H * txtSm);
    });
  }
  {
    // バーコード + 進捗バー + %(右下角・底揃え)。③ この 2 要素だけ rsBar で拡大。
    const rsBar = rs * BAR_BOOST;
    const bh = Math.max(3, Math.round(h * 0.045 * rsBar));
    const pbH = Math.max(3, Math.round(h * 0.03 * rsBar));
    const pctH = GLYPH_H * txtSm;
    const gap1 = Math.round(h * 0.02);
    const gap2 = Math.round(h * 0.01);
    const stackH = bh + gap1 + pbH + gap2 + pctH;
    const by = Math.max(lowerTop, lowerBot - stackH);
    add('バーコード', by, by + bh);
    const pbY = by + bh + gap1;
    add('進捗バー', pbY, pbY + pbH);
    const pctY = pbY + pbH + gap2;
    if (pctY + pctH <= lowerBot + 1e-3) add('%数値', pctY, pctY + pctH);
  }

  return { ext, clearTopY, clearBotY, lowerBot, pad };
}

// ==================================================================
// 実行
// ==================================================================
let pass = true;
const out = [];
const ids = ['about', 'services', 'works', 'career', 'contact'];

for (const id of ids) {
  const isLarge = id === 'about';
  const dim = isLarge ? PANEL_SIZES.lg : PANEL_SIZES.md;
  const PANEL_W = dim.w, PANEL_H = dim.h;
  const theme = HUD_THEMES[id];
  const zone = isLarge ? CLEAR_ZONE.lg : CLEAR_ZONE.md;
  const { tw, th } = texDim(PANEL_W, PANEL_H);

  out.push(`\n== ${id}${isLarge ? '(lg)' : '(md)'}  panel ${PANEL_W}x${PANEL_H}  tex ${tw}x${th} ==`);
  out.push(`  CLEAR_ZONE v[${zone.top}..${zone.bot}]  (帯高 ${((zone.bot - zone.top) * 100).toFixed(1)}%)`);

  // --- PART 1: ラベル plane / キャプション / リングが帯に内包されるか(v) ---
  const lp = labelPlane(isLarge, PANEL_W);
  // ラベル plane 矩形(cx,cy,planeW,planeH)の上下端・左右端を UV 化。
  const lTopV = worldToUV(0, lp.cy + lp.planeH / 2, PANEL_W, PANEL_H).v;
  const lBotV = worldToUV(0, lp.cy - lp.planeH / 2, PANEL_W, PANEL_H).v;
  const lLU = worldToUV(lp.cx - lp.planeW / 2, 0, PANEL_W, PANEL_H).u;
  const lRU = worldToUV(lp.cx + lp.planeW / 2, 0, PANEL_W, PANEL_H).u;
  // キャプション(②後: 左寄せ anchor)。
  const cap = captionLayout(isLarge, lp);
  const cbb = captionWorldBBox(theme.caption, cap.leftX, cap.y, cap.fs, cap.ls);
  const cTopV = worldToUV(0, cbb.yTop, PANEL_W, PANEL_H).v;
  const cBotV = worldToUV(0, cbb.yBot, PANEL_W, PANEL_H).v;
  const cLU = worldToUV(cbb.x0, 0, PANEL_W, PANEL_H).u;
  const cRU = worldToUV(cbb.x1, 0, PANEL_W, PANEL_H).u;
  // リング(左, 中心 y=0.06, R)。
  const ringTopV = worldToUV(0, 0.06 + lp.ringR, PANEL_W, PANEL_H).v;
  const ringBotV = worldToUV(0, 0.06 - lp.ringR, PANEL_W, PANEL_H).v;

  const labelIn = lTopV >= zone.top - 1e-6 && lBotV <= zone.bot + 1e-6 && lRU <= 1 + 1e-6 && lLU >= -1e-6;
  const capIn = cTopV >= zone.top - 1e-6 && cBotV <= zone.bot + 1e-6 && cRU <= 1 + 1e-6 && cLU >= -1e-6;
  const ringIn = ringTopV >= zone.top - 1e-6 && ringBotV <= zone.bot + 1e-6;
  out.push(`  ラベルplane "${DISPLAY[id]}" v[${lTopV.toFixed(3)}..${lBotV.toFixed(3)}] u[${lLU.toFixed(3)}..${lRU.toFixed(3)}]${lRU > 1 ? '(u超!)' : ''}  帯内=${labelIn ? 'OK' : 'NG'}`);
  out.push(`  キャプション "${theme.caption}" v[${cTopV.toFixed(3)}..${cBotV.toFixed(3)}] u[${cLU.toFixed(3)}..${cRU.toFixed(3)}]${cRU > 1 || cLU < 0 ? '(u超!)' : ''}  帯内=${capIn ? 'OK' : 'NG'}`);
  out.push(`  リング v[${ringTopV.toFixed(3)}..${ringBotV.toFixed(3)}]  帯内=${ringIn ? 'OK' : 'NG'}`);
  if (!labelIn || !capIn || !ringIn) { pass = false; out.push('  !! PART1 帯内包/横はみ出し NG'); }

  // --- PART 2: リードアウトが帯へ侵入しないか(px) ---
  const { ext, clearTopY, clearBotY, lowerBot } = drawnExtents(theme, tw, th, isLarge);
  out.push(`  クリア帯(px) [${clearTopY.toFixed(1)}..${clearBotY.toFixed(1)}]  下端 h-pad=${lowerBot.toFixed(1)}`);
  let allOut = true;
  for (const e of ext) {
    const overlap = e.yMax > clearTopY + 1e-6 && e.yMin < clearBotY - 1e-6;
    const overBottom = e.yMax > lowerBot + 1e-6;
    const okE = !overlap && !overBottom;
    if (!okE) allOut = false;
    const zoneLbl = e.yMax <= clearTopY + 1e-6 ? '上' : e.yMin >= clearBotY - 1e-6 ? '下' : '帯内!!';
    out.push(`    ${e.name.padEnd(14)} y[${e.yMin.toFixed(0)}..${e.yMax.toFixed(0)}] ${zoneLbl}${okE ? '' : ' <== 侵入/はみ出し'}`);
  }
  if (!allOut) { pass = false; out.push('  !! PART2 リードアウトが帯へ侵入/下端はみ出し'); }

  // --- PART 3: 下ストリップ 3 カラム(チャート/統計/バーコード)の水平非重複 ---
  {
    const pad = Math.round(tw * 0.04);
    const rs = isLarge ? 0.7 : 0.5;
    const txtSm = Math.max(0.8, (tw / 360) * rs);
    const chartR = pad + Math.round(tw * 0.36 * rs);
    const statX = Math.round(tw * 0.42);
    const maxHexLen = Math.max(...theme.hexRows.map((r) => r.length));
    const statRight = statX + maxHexLen * 6 * txtSm;
    const bxBase = Math.max(Math.round(tw * 0.66), statRight + Math.round(tw * 0.03));
    const bwFull = tw - pad - bxBase;
    // ③ バーコード幅は rsBar(= rs × BAR_BOOST)で拡縮し、使える最大幅で上限クランプ。
    const bw = Math.max(8, Math.min(bwFull, Math.round(bwFull * rs * BAR_BOOST)));
    const bx = tw - pad - bw; // 右詰め
    const okCH = chartR <= statX, okHB = statRight <= bx, okBW = bw > 0;
    out.push(`  下段カラム chart[..${chartR}] stat[${statX}..${Math.round(statRight)}] bar[${bx}..${bx + bw}](幅${bw})  chart<stat:${okCH ? 'OK' : 'NG'} stat<bar:${okHB ? 'OK' : 'NG'} bar幅>0:${okBW ? 'OK' : 'NG'}`);
    if (!okCH || !okHB || !okBW) { pass = false; out.push('  !! PART3 下ストリップ 3 カラムが水平で重複/バー幅ゼロ'); }
  }
}

console.log(out.join('\n'));
console.log('\n' + (pass
  ? '=== 中央クリアゾーン: ラベルplane/キャプション/リング内包 + 全リードアウトが帯の外(rs縮小・四隅底揃え)  PASS ✔'
  : '=== 中央クリアゾーン: FAIL ✗'));
process.exit(pass ? 0 : 1);
