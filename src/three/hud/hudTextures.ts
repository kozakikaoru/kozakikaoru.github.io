// パネル内 2D 装飾の高解像度 procedural CanvasTexture(analyst 方針の主役)。
// 2 層に分ける:
//   (a) 淡いディテール層 makeDetailTexture: 回路トレース/グリッド/薄い罫線/スキャンライン。
//       低輝度・Bloom 閾値未満(<0.9)。ガラスの "中身" 感。accent+size でキャッシュ共有。
//   (b) 発光ディテール層 makeGlowTexture: 光らせるリードアウト(16進/バー/波形/座標/
//       ステータスタグ/バーコード/進捗バー)。白インクのマスクとして描き、
//       material.color = HDR accent(neonColor)で "色付き発光" にする。
//       → 8bit sRGB texel は linear 1.0 で頭打ちなので、彩度の高い accent を texel 自体で
//         0.9 超にはできない。テクスチャは白マスク、色は HDR material.color で乗せる方式にすると、
//         line 群と同じ機構で「どの accent でも閾値 0.9 を確実に超える」発光になる。
//
// パフォーマンス: 生成解像度は crisp に見える程度。淡ディテール層は accent+size でキャッシュ
//   して 5 枚で共有(同一 accent/サイズなら再生成しない)。発光層はテーマ別なので個別だが
//   小さめ解像度で足りる。呼び出し側で必ず dispose(useMemo で 1 度だけ生成し、アンマウント
//   effect で dispose する StrictMode 安全な方式。refcount は使わない)。
//
// ■ 中央クリアゾーン(発光リードアウトの配置規約):
//   パネル中央の水平帯 = 左リング + 英字ラベル(CAREER 等)+ サブ行(ROADMAP // 2019+)が
//   占める領域。ここには発光リードアウトを一切描かない(中央を空けて可読性を確保)。
//   英字ラベルは幅広(CONTACT/SERVICES)だと水平にパネル全幅近くまで広がるため、
//   クリアゾーンは "帯の高さ全幅" で確保し、リードアウトは
//     ・上ストリップ(帯より上, v < clearTop): ステータスタグ / NODE 番号 / 副情報。
//     ・下ストリップ(帯より下, v > clearBot): バーコード / 進捗バー / 統計行 / チャート。
//     ・四隅(上下ストリップの左右端): 極小の識別子。
//   のみに置く。→ どの幅広ラベルとも v 方向で分離するので非接触(数式保証: verify_clearzone.mjs)。
import * as THREE from 'three';
import { cssRGBA } from './neon';
import type { HudTheme } from './hudTheme';

// ------------------------------------------------------------------
// 中央クリアゾーン(発光リードアウトを置かない中央の水平帯)。UV の v(0=上, 1=下)。
// ------------------------------------------------------------------
// glowTexture plate は planeGeometry(PANEL_W*0.92, PANEL_H*0.92) に貼るので、
// テクスチャ UV は plate world 座標に直結する(u: 左→右, v: 上→下)。
// この帯は GlassPanel の drei Text ラベル/サブ行 + 左リングの占有域を UV 化し、
// 上下に安全マージンを足して決めた値(scratchpad/verify_clearzone.mjs で導出・検証)。
//   lg(ABOUT): ラベル fs=0.42・サブ fs=0.11、パネル 4.7x3.2。
//   md(他4枚): ラベル fs=0.32・サブ fs=0.088、パネル 2.9x1.55(縦が短いぶん帯は広め)。
// リードアウトは v < clearTop(上ストリップ)/ v > clearBot(下ストリップ)のみに描く。
export const CLEAR_ZONE = {
  lg: { top: 0.27, bot: 0.655 },
  md: { top: 0.18, bot: 0.7 },
} as const;

// ------------------------------------------------------------------
// バーコード/ゲージ専用の拡大係数(③ ユーザー FB「ほんの少し大きく」)。
// ------------------------------------------------------------------
// makeGlowTexture の下ストリップ右下クラスタ(バーコード帯 + 進捗バー + %)にだけ、
// 実効スケール rsBar = rs × BAR_BOOST を掛けて控えめに拡大する。他のリードアウトは rs のまま。
// 1.25 = 「ほんの少し」。上げすぎると下ストリップの縦積みが高くなり中央クリアゾーンへ
// 近づくため、verify_clearzone.mjs で by がクリア帯を割らないことを必ず確認すること。
export const BAR_BOOST = 1.25;

// ------------------------------------------------------------------
// 決定論的擬似乱数(seed 依存)
// ------------------------------------------------------------------
function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finishTexture(
  canvas: HTMLCanvasElement,
  aniso: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = aniso;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ==================================================================
// (A) 中央の日本語ラベル(canvas 2D fillText の発光テクスチャ)
// ==================================================================
// drei Text は ASCII 専用(日本語グリフを持たない)ため、パネル中央の大ラベル
// (「小崎 薫」「お力になれること」等)は canvas 2D の fillText で描く。
// canvas はシステムフォント(Hiragino Sans / Noto Sans JP)で日本語を描けるので、
// フォントファイルのバンドルは不要。白インクで描き、呼び出し側 material の
// color = HDR accent(neonColor)+ toneMapped=false で、既存の発光線と同じ機構で
// ネオン発光(白マスク × HDR accent → 閾値 0.9 超)にする。
//
// 中央クリアゾーン(の右側=リングを除いた領域)にそのまま貼る前提。テクスチャの
// アスペクトは貼り先 plane と一致させる(伸び/潰れ防止)。長いラベル
// (「お力になれること」= 8 文字)でも収まるよう、字幅を測って
//   ①フォント px を縮小し ②必要なら字間(letter-spacing)を詰めて 幅内に必ず収める。
// 描画は左寄せ(ユーザー FB: センタリング解除)。左端に安全余白を取り、そこから
// 字を並べる。貼り先 plane も左基準(GlassPanel.tsx)にして左から読めるようにする。
//
// @param label 表示する日本語ラベル(panels.ts の displayLabel)。
// @param w,h   テクスチャ解像度(貼り先 plane の縦横比に一致させる)。
// @param font  描画フォント(family + weight)。未指定は従来どおり system + bold。
const DEFAULT_LABEL_FONT = {
  family: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
  weight: 'bold',
} as const;

export function makeLabelTexture(
  label: string,
  w: number,
  h: number,
  font: { family: string; weight: string } = DEFAULT_LABEL_FONT,
  outlineWidthEm = 0, // >0 で「塗りなし・太い白ストロークのみ」= 縁取り層用(呼び出し側で着色)
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const chars = Array.from(label); // サロゲート安全に 1 文字ずつ
  const n = chars.length;

  // 使える描画幅/高さ(左右・上下に少し安全余白)。
  const usableW = w * 0.94;
  const usableH = h * 0.82;

  const setFont = (px: number) => {
    ctx.font = `${font.weight} ${px}px ${font.family}`;
  };

  // 各文字の advance(等幅ではないので個別に測る)。字間 spacing を足した合計幅を返す。
  const totalWidth = (px: number, spacing: number): number => {
    setFont(px);
    let sum = 0;
    for (const ch of chars) sum += ctx.measureText(ch).width;
    return sum + Math.max(0, n - 1) * spacing;
  };

  // フォント px の初期値: 高さ基準(和文は概ね em ≒ 字面)。まず高さから当たりを付け、
  // 幅に収まるまで縮小する。字間は px に比例した基準値から始め、溢れる時だけさらに詰める。
  let px = usableH; // 高さ上限から開始
  // 字間の基準(短いラベルは少しゆったり、長いラベルは詰め気味に自動化)。
  const baseSpacingRatio = n <= 3 ? 0.12 : n <= 5 ? 0.06 : 0.02;
  let spacing = px * baseSpacingRatio;

  // 幅に収まるよう px を縮める(最大 40 反復で収束)。
  for (let i = 0; i < 40; i++) {
    const tw = totalWidth(px, spacing);
    if (tw <= usableW) break;
    const scale = usableW / tw;
    px *= scale > 0.98 ? 0.98 : scale; // 行き過ぎ防止に下限係数
    spacing = px * baseSpacingRatio;
  }
  // それでも僅かに溢れる場合(反復打ち切り)、字間を 0 まで詰めて最終担保。
  if (totalWidth(px, spacing) > usableW) spacing = 0;
  if (totalWidth(px, spacing) > usableW) {
    // 字間 0 でも溢れるなら px をもう一段だけ落として確実に収める。
    const tw = totalWidth(px, 0);
    px *= usableW / tw;
  }

  setFont(px);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,1)'; // 白マスク(色は material.color=HDR accent)

  // 左寄せ配置(ユーザー FB: センタリング解除・元の左寄せに戻す)。
  // 左端に安全余白(usableW を w 中央に取っているのと同じ左パディング)を確保し、
  // そこから 1 文字ずつ字間込みで描く。貼り先 plane も左基準にするので
  // (GlassPanel.tsx label.cx)、リング右からラベルが左から自然に読める。
  const finalSpacing = spacing;
  setFont(px); // totalWidth 内で font を書き換えるため戻す
  const padX = (w - usableW) / 2; // 左パディング(= 右にも同量の安全余白)
  const cy = h / 2;
  let cx = padX;
  if (outlineWidthEm > 0) {
    // 縁取り層: 塗りなし・太い白ストロークのみ。塗り層の後ろに重ねて着色すると、
    // 文字の縁だけが指定色(濃いピンク)で縁取られて見える。
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, px * outlineWidthEm);
    ctx.strokeStyle = 'rgba(255,255,255,1)';
    for (const ch of chars) {
      ctx.strokeText(ch, cx, cy);
      cx += ctx.measureText(ch).width + finalSpacing;
    }
  } else {
    // 通常(塗り層): 白で塗る + 発光を安定させる薄い白ストローク。
    for (const ch of chars) {
      ctx.fillText(ch, cx, cy);
      cx += ctx.measureText(ch).width + finalSpacing;
    }
    ctx.lineWidth = Math.max(1, px * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    cx = padX;
    for (const ch of chars) {
      ctx.strokeText(ch, cx, cy);
      cx += ctx.measureText(ch).width + finalSpacing;
    }
  }

  return finishTexture(canvas, 8);
}

// ==================================================================
// (a) 淡いディテール層(<0.9・非発光)
// ==================================================================
/**
 * ガラス内側に敷く回路トレース/薄いグリッド/細い罫線/スキャンラインを描く。
 * 低コントラスト・低 opacity 前提(呼び出し側 material も低 opacity)。
 * 発光はさせない(平均輝度が低く、material の toneMapped 既定でも閾値未満)。
 *
 * @param hex   accent 色(#rrggbb)。トレース/矩形にごく淡く使う。
 * @param seed  模様のばらつき。
 * @param w,h   テクスチャ解像度(パネル縦横比に合わせる)。
 */
export function makeDetailTexture(
  hex: string,
  seed: number,
  w: number,
  h: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const rnd = mulberry(seed * 2654435761);
  const accent = new THREE.Color(hex);
  const cool = new THREE.Color('#cfe3ff');
  const traceCol = cool.clone().lerp(accent, 0.35);

  // 1) 薄いグリッド(等間隔の細い罫線)。淡く全面に。
  ctx.lineWidth = 1;
  ctx.strokeStyle = cssRGBA(cool, 0.05);
  const gridStep = Math.round(w / 14);
  for (let x = gridStep; x < w; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = gridStep; y < h; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }

  // 2) 回路トレース(直角に折れる線 + 端のパッド + ビア)。
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = cssRGBA(traceCol, 0.16);
  const traceCount = 11;
  for (let i = 0; i < traceCount; i++) {
    ctx.beginPath();
    let x = rnd() * w;
    let y = rnd() * h;
    ctx.moveTo(x, y);
    const segs = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < segs; j++) {
      if (rnd() < 0.5) x += (rnd() - 0.5) * w * 0.35;
      else y += (rnd() - 0.5) * h * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    // パッド(接点)。
    ctx.fillStyle = cssRGBA(traceCol, 0.18);
    ctx.fillRect(x - 2, y - 2, 4, 4);
    // ビア(中抜きの小円)。
    ctx.strokeStyle = cssRGBA(cool, 0.12);
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = cssRGBA(traceCol, 0.16);
  }

  // 3) チップパッド(小さな四角の並び = IC の足)。数箇所。
  const chipCount = 4;
  for (let i = 0; i < chipCount; i++) {
    const cx = rnd() * (w - 40) + 20;
    const cy = rnd() * (h - 30) + 15;
    const n = 4 + Math.floor(rnd() * 4);
    ctx.fillStyle = cssRGBA(traceCol, 0.12);
    for (let k = 0; k < n; k++) {
      ctx.fillRect(cx + k * 5, cy, 3, 7);
    }
  }

  // 4) 散らばった小ドット(データポイント)。
  const dotCount = Math.round((w * h) / 900);
  for (let i = 0; i < dotCount; i++) {
    const a = 0.04 + rnd() * 0.08;
    ctx.fillStyle = cssRGBA(cool, a);
    ctx.fillRect(rnd() * w, rnd() * h, rnd() < 0.85 ? 1 : 1.6, 1);
  }

  // 5) 控えめなスキャンライン(水平の細い薄帯を等間隔に)。極薄。
  ctx.fillStyle = cssRGBA(cool, 0.02);
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // 6) 小さな矩形(HUD のデータ枠・輪郭だけ)。
  ctx.strokeStyle = cssRGBA(traceCol, 0.12);
  const rectCount = 6;
  for (let i = 0; i < rectCount; i++) {
    const rw = 10 + rnd() * 40;
    const rh = 6 + rnd() * 22;
    ctx.strokeRect(rnd() * (w - rw), rnd() * (h - rh), rw, rh);
  }

  const tex = finishTexture(canvas, 4);
  return tex;
}

// ==================================================================
// (b) 発光ディテール層(白マスク・色は HDR material.color で乗せる)
// ==================================================================
/** makeGlowTexture のレイアウト微調整オプション(省略時は isLarge から標準決定)。 */
export interface GlowLayoutOpts {
  /** 下ストリップ(グラフ/統計/バーコード)を右へ寄せる割合(0..1・写真回避)。上ストリップは動かさない。 */
  insetLeft?: number;
  /** リードアウト縮尺(省略時は isLarge から)。 */
  rs?: number;
  /** 中央クリアゾーン(省略時は isLarge から)。 */
  zone?: { top: number; bot: number };
  /** ミニチャート(グラフ)の追加右オフセット(w 比)。 */
  chartOffsetX?: number;
  /** 統計行(hex 数字)の縦オフセット(h 比・負で上)。 */
  hexOffsetY?: number;
}

/**
 * 光らせたい HUD リードアウト群を "白インクのマスク" として描く。
 * material 側で map をこのテクスチャ、color を HDR accent(neonColor)にすると、
 * output = texel(白≈1) × color(HDR) となり、accent 色で閾値 0.9 を確実に超える発光になる。
 *
 * 配置規約(中央クリアゾーン): 中央の水平帯(ラベル/サブ行/左リング)は空ける。
 * リードアウトは "少数ずつ上品に" 上下ストリップと四隅のみに置く(analyst / ユーザー:
 * ノイズにしない・中央を渋滞させない)。
 *   - 上ストリップ(v < clearTop): 左にステータスタグ(枠付き)、右上隅に副情報(座標/バージョン)。
 *   - 下ストリップ(v > clearBot): 左にミニチャート + 単位、右にバーコード + 進捗バー、
 *     中央下に統計小行(SEG/KM/ETA 等の hexRows)。
 *   - 四隅: 極小の識別子(seriesCode)を上ストリップ左端 / キャプションを下ストリップに寄せる。
 * ※ 文字は "セグメント/ドット風の自前グリフ" で描く(フォント依存を避け、
 *   HUD らしいピクセル調にする)。ASCII のみ。
 *
 * @param theme   パネルのテーマ(リードアウト内容)。
 * @param w,h     テクスチャ解像度(パネル縦横比)。
 * @param isLarge lg(ABOUT)か。中央クリアゾーンの帯(CLEAR_ZONE)を選ぶのに使う。
 */
export function makeGlowTexture(
  theme: HudTheme,
  w: number,
  h: number,
  isLarge: boolean,
  opts: GlowLayoutOpts = {},
): THREE.CanvasTexture {
  const contentInsetLeft = opts.insetLeft ?? 0; // 下ストリップの左インセット(写真回避)
  const chartOffsetXPx = Math.round((opts.chartOffsetX ?? 0) * w); // グラフの追加右オフセット
  const hexOffsetYPx = Math.round((opts.hexOffsetY ?? 0) * h); // 統計行の縦オフセット(負で上)
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  // 中央クリアゾーン(v: 0..1)。この帯の内側にはリードアウトを一切描かない。
  const zone = opts.zone ?? (isLarge ? CLEAR_ZONE.lg : CLEAR_ZONE.md);
  const clearTopY = zone.top * h; // 上ストリップの下限(px)
  const clearBotY = zone.bot * h; // 下ストリップの上限(px)

  // 白マスク(色は material.color = HDR accent が乗せる)。ここでは白の濃淡だけ。
  const ink = (a: number) => `rgba(255,255,255,${a})`;

  // --- 5x7 ドットマトリクス風フォント(ASCII 部分集合)---
  // 各グリフを 5 列 × 7 行のビットで表す。HUD らしいセグメント文字。
  const FONT: Record<string, string[]> = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
    '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  };

  // ドット文字列を (x,y) 左上・セルサイズ px・alpha で描く。戻り値=描画後の右端 x。
  const drawText = (
    str: string,
    x: number,
    y: number,
    px: number,
    a: number,
  ): number => {
    let cx = x;
    for (const chRaw of str.toUpperCase()) {
      const ch = FONT[chRaw] ? chRaw : ' ';
      const rows = FONT[ch];
      for (let r = 0; r < 7; r++) {
        const bits = rows[r];
        for (let c = 0; c < 5; c++) {
          if (bits[c] === '1') {
            ctx.fillStyle = ink(a);
            ctx.fillRect(cx + c * px, y + r * px, px, px);
          }
        }
      }
      cx += 6 * px; // 1 セル空ける
    }
    return cx;
  };

  // レイアウトの基準(テクスチャ座標: 左上原点)。左右の端パッド。
  // ユーザー要望「もうちょい寄せて」→ 端の余白を詰めてリードアウトを縁側へ寄せる。
  const pad = Math.round(w * 0.04);
  // 【左インセット】ABOUT のように左側へ写真を置く場合、リードアウト群を右側の領域
  //   [x0, w] に寄せる(左側の計器が写真に隠れないように)。contentInsetLeft=0 なら従来通り。
  const x0 = Math.round(contentInsetLeft * w); // 下ストリップの左端(px・写真回避で右へ)
  const left = x0 + pad; // 下ストリップ左寄せ要素の左端(pad ぶん内側)
  const cw = w - x0; // 下ストリップが使える横幅
  // 上ストリップ(左上タグ/識別子)は insetLeft の影響を受けず常に元位置(ユーザーFB)。
  const topLeft = pad;
  // 上下ストリップの内側に少し余白を取り、帯(クリアゾーン)へ食い込まないようにする。
  const stripGap = Math.round(h * 0.02);

  // リードアウトのスケール(ユーザー要望: ABOUT=30%小さく / それ以外=50%小さく)。
  // ※ ドットセル px は分数のまま使う。整数丸めだと rs=0.7 と 0.5 が同値(2px)に
  //    潰れてパネル間の差が消えるため。ctx.fillRect は分数座標でも描画できる。
  // ※【C】この rs は文字セル px だけでなく、下ストリップの図形リードアウト
  //    (チャート幅/高・バーコード幅/高・進捗バー高・各線幅・ノード寸法)にも掛ける。
  //    → テキストと図形が一緒に縮み、クラスタ全体が明確に小さく見える。
  const rs = opts.rs ?? (isLarge ? 0.7 : 0.5);
  // 文字セル px。1 文字 = 6*px 幅・7*px 高。
  const txt = Math.max(0.8, (w / 300) * rs); // 標準テキスト
  const txtSm = Math.max(0.8, (w / 360) * rs); // 小テキスト(統計/座標)
  const glyphH = 7; // フォント行高(セル数)

  // ================= 上ストリップ(v < clearTop) =================
  // 左: ステータスタグ(枠付き)+ 左隅に seriesCode の極小識別子。
  // 右: 副情報(座標/バージョン)を右寄せ。すべて clearTopY より上に収める。
  {
    // 上ストリップ(左上タグ/識別子・右上座標)だけ少し大きくする(ユーザーFB①)。下ストリップは据置。
    const topScale = 1.3;
    // タグは上ストリップの上寄せ。枠込み高 = 7*px + 上下パディング。
    const px = Math.max(1.2, (w / 300) * rs) * topScale; // タグ文字(rs 縮小 × 上HUD拡大)
    const framePad = px * 2; // 枠内パディング(上下左右)
    const tagX = topLeft + framePad;
    const tagY = pad + framePad;
    const textW = theme.statusTag.length * 6 * px;
    // 枠。上端 pad から、下端 = tagY + 7*px + framePad。
    ctx.strokeStyle = ink(0.9);
    ctx.lineWidth = Math.max(1, px * 0.6);
    ctx.strokeRect(topLeft, pad, textW + framePad * 2, glyphH * px + framePad * 2);
    drawText(theme.statusTag, tagX, tagY, px, 1);
    // 点滅ドット(枠のすぐ右に小さな●)。
    const dotX = topLeft + textW + framePad * 2 + px * 2;
    ctx.fillStyle = ink(1);
    ctx.fillRect(dotX, pad + framePad, px * 2, px * 2);

    // 左隅の極小識別子(seriesCode)。タグ枠の下・上ストリップ内に収まる時だけ描く(少し大きく)。
    const codeSize = txtSm * topScale;
    const codeY = pad + glyphH * px + framePad * 2 + Math.round(h * 0.015);
    if (codeY + glyphH * codeSize <= clearTopY - stripGap) {
      drawText(theme.seriesCode, topLeft, codeY, codeSize, 0.7);
    }

    // 右上: 副情報(座標/バージョン)。右寄せ・上ストリップ上端(少し大きく)。
    const s = theme.subReadout;
    const subSize = txt * topScale;
    const subW = s.length * 6 * subSize;
    drawText(s, w - pad - subW, pad + subSize, subSize, 0.85);
  }

  // ================= 下ストリップ(v > clearBot) =================
  // 左: ミニチャート + 単位。右: バーコード + 進捗バー。中央下: 統計小行(hexRows)。
  // すべて clearBotY より下・(h-pad) より上に収める。
  //
  // 【C: 図形もパネル別に縮小】テキスト(txt/txtSm)だけでなく図形リードアウト
  //   (チャート/バーコード/進捗バー)も rs で縮める。→ クラスタ全体が
  //   ABOUT 30% / 他 50% 小さくなり、「文字だけ変わって図形が同じ」を解消。
  // 【D: 四隅寄せ】CTA 矢印を廃止して空いた右下へ、図形を下端(lowerBot)へ底揃えで
  //   詰める。チャート=左下角、バーコード/進捗=右下角に寄せてバランスを取る。
  const lowerTop = clearBotY + stripGap; // 下ストリップの上端
  const lowerBot = h - pad; // 下ストリップの下端
  const lowerSpan = lowerBot - lowerTop; // 下ストリップの使える縦幅

  // --- 左下(角に寄せ): ミニチャート + 単位ラベル ---
  // チャートの実寸を rs で縮小(幅・高さとも)。下端に底揃えして左下角へ寄せる。
  {
    const chartX = left + chartOffsetXPx; // グラフをもう少し右へ(ユーザーFB・ABOUT)
    const chartW = Math.round(w * 0.36 * rs); // 幅も rs で縮小
    const unitH = glyphH * txtSm; // 単位ラベルぶんの高さ
    const unitGap = Math.round(h * 0.01);
    // チャート高も rs で縮小(下ストリップ縦幅の一定割合を上限に)。
    const chartH = Math.max(8, Math.round(lowerSpan * 0.62 * rs));
    // 底揃え: チャート下端が (lowerBot - unitH - unitGap) に来るよう chartY を決める
    //   → 単位ラベルはその下、下端手前に収める(四隅寄せ)。
    const chartY = lowerBot - unitH - unitGap - chartH;
    drawChart(ctx, ink, theme, chartX, chartY, chartW, chartH, rs);
    // 単位ラベル(チャート直下)。
    drawText(theme.unit, chartX, chartY + chartH + unitGap, txtSm, 0.8);
  }

  // --- 中央下: 統計小行(hexRows: SEG/KM/ETA 等)を縦に数行 ---
  // 統計列の右端を測っておき、右下のバーコード列の開始 x をその外側に取る
  // (lg の hexRows は 14 字と長く、固定 x だとバーコードと水平で触れるため)。
  // 文字は txtSm(rs 反映済み)なので、行送りも自動的に縮む。
  const statX = Math.round(x0 + cw * 0.42);
  let statRight = statX;
  {
    const rowStep = glyphH * txtSm + Math.round(h * 0.012);
    theme.hexRows.slice(0, 3).forEach((row, i) => {
      const ry = lowerTop + i * rowStep + hexOffsetYPx; // 数字をもう少し上へ(ユーザーFB・ABOUT)
      // 下端をはみ出す行は描かない(安全側)。
      if (ry + glyphH * txtSm <= lowerBot) {
        drawText(row, statX, ry, txtSm, 0.7);
        statRight = Math.max(statRight, statX + row.length * 6 * txtSm);
      }
    });
  }

  // --- 右下(角に寄せ): バーコード帯 + 進捗バー + % ---
  // バーコード幅・高さ・進捗バー高を rs で縮小し、下端へ底揃えで右下角に詰める。
  // 【③】ユーザー FB「バーコードとゲージをほんの少し大きく」→ この 2 要素だけ
  //   専用スケール rsBar = rs × BAR_BOOST(控えめ 1.25 倍)で拡大する。他のリードアウト
  //   (チャート/統計/座標/タグ)は rs 据え置き。% 数値は文字サイズ(txtSm)据え置き。
  //   拡大しても右詰め(bx)・底揃え(by)なので中央クリアゾーンには侵入しない
  //   (by は下端基準で決まり、stackH が増えても by が上へ動くだけ→ verify_clearzone で担保)。
  {
    const rnd = mulberry(theme.seriesCode.charCodeAt(0) * 7919 + 13);
    const rsBar = rs * BAR_BOOST; // バーコード/ゲージ専用の実効スケール(ほんの少し拡大)
    // バーコード/ゲージは元々右端。ABOUT の写真回避インセット(insetLeft>0)では統計行を
    //   上へ逃がしてある(hexOffsetY<0)ので水平の衝突が起きず、インセットで幅を潰す必要が
    //   ない → 全幅基準の開始位置にして横比率を保つ(ユーザーFB「押しつぶされてる/比率そのまま」)。
    //   それ以外(md)は従来どおり x0 起点 + 統計列を避けた開始位置。
    const bxBase =
      contentInsetLeft > 0
        ? Math.round(pad + (w - 2 * pad) * 0.62)
        : Math.max(Math.round(x0 + cw * 0.66), statRight + Math.round(w * 0.03));
    // バーコード列の最大幅を rsBar で拡縮し、右端(w-pad)に右詰め。
    // 拡大側は使える最大幅 bwFull を超えないようにクランプ(統計列へ食い込ませない)。
    const bwFull = w - pad - bxBase; // 使える最大幅
    const bw = Math.max(8, Math.min(bwFull, Math.round(bwFull * rsBar))); // rsBar・上限クランプ
    const bx = w - pad - bw; // 右詰め(四隅寄せ)
    const bh = Math.max(3, Math.round(h * 0.045 * rsBar));
    const pbH = Math.max(3, Math.round(h * 0.03 * rsBar));
    const pctH = glyphH * txtSm;
    const gap1 = Math.round(h * 0.02);
    const gap2 = Math.round(h * 0.01);
    // 底揃え: [バーコード bh][gap1][進捗 pbH][gap2][% pctH] の縦積みを
    //   下端 lowerBot に底揃え。まずスタック全高から by(最上=バーコード上端)を出す。
    const stackH = bh + gap1 + pbH + gap2 + pctH;
    const by = Math.max(lowerTop, lowerBot - stackH);
    // バーコード(不規則な縦線)。線幅も rsBar でわずかに太く。
    const lwMax = Math.max(1, 3 * rsBar);
    let x = bx;
    while (x < bx + bw) {
      const lw = Math.max(1, 1 + Math.floor(rnd() * lwMax));
      if (rnd() < 0.6) {
        ctx.fillStyle = ink(0.85);
        ctx.fillRect(x, by, lw, bh);
      }
      x += lw + 1;
    }
    // 進捗バー(枠 + 充填)。
    const pbY = by + bh + gap1;
    ctx.strokeStyle = ink(0.8);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, pbY, bw, pbH);
    ctx.fillStyle = ink(0.9);
    ctx.fillRect(bx + 1, pbY + 1, (bw - 2) * theme.gauge, pbH - 2);
    // 進捗の数値(%)。下端に収まる時だけ。
    const pct = `${Math.round(theme.gauge * 100)}%`;
    const pctY = pbY + pbH + gap2;
    if (pctY + pctH <= lowerBot + 1e-3) drawText(pct, bx, pctY, txtSm, 0.8);
  }

  return finishTexture(canvas, 8);
}

// ------------------------------------------------------------------
// ミニチャート(テーマ別)を白インクで描く
// ------------------------------------------------------------------
function drawChart(
  ctx: CanvasRenderingContext2D,
  ink: (a: number) => string,
  theme: HudTheme,
  x: number,
  y: number,
  w: number,
  h: number,
  rs: number, // リードアウト縮小率(線幅・ノード等の固定 px を一緒に縮める)
) {
  const rnd = mulberry(theme.caption.length * 104729 + 7);
  // 線幅・ノード寸法は rs で縮める(w/h は呼び出し側で rs 済み)。
  const lw = Math.max(0.6, rs); // 基準線幅(1px を rs 倍)
  // 軸(左 + 下)。
  ctx.strokeStyle = ink(0.55);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();

  switch (theme.chart) {
    case 'bars': {
      const n = 9;
      const bw = (w / n) * 0.6;
      for (let i = 0; i < n; i++) {
        const bh = h * (0.25 + rnd() * 0.7);
        const bx = x + (w / n) * i + (w / n - bw) / 2;
        ctx.fillStyle = ink(0.85);
        ctx.fillRect(bx, y + h - bh, bw, bh);
      }
      break;
    }
    case 'signal': {
      // 右肩上がりの階段バー(シグナル強度)。
      const n = 6;
      const bw = (w / n) * 0.62;
      for (let i = 0; i < n; i++) {
        const bh = h * (0.2 + (0.8 * (i + 1)) / n);
        const bx = x + (w / n) * i + (w / n - bw) / 2;
        // 最後の 1 本だけ枠(未到達)風にすると "作り込み" 感。
        if (i === n - 1) {
          ctx.strokeStyle = ink(0.7);
          ctx.strokeRect(bx, y + h - bh, bw, bh);
        } else {
          ctx.fillStyle = ink(0.85);
          ctx.fillRect(bx, y + h - bh, bw, bh);
        }
      }
      break;
    }
    case 'wave': {
      // 折れ線波形(なめらかめの擬似正弦 + ノイズ)。
      ctx.strokeStyle = ink(0.9);
      ctx.lineWidth = 1.4 * rs;
      ctx.beginPath();
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const yy =
          y +
          h / 2 -
          (Math.sin(t * Math.PI * 4) * 0.32 + (rnd() - 0.5) * 0.16) * h;
        const xx = x + w * t;
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      break;
    }
    case 'path': {
      // 座標を結ぶ折れ線 + ノード(経路)。
      const pts: [number, number][] = [];
      const n = 6;
      for (let i = 0; i < n; i++) {
        pts.push([x + (w * i) / (n - 1), y + h * (0.2 + rnd() * 0.6)]);
      }
      ctx.strokeStyle = ink(0.85);
      ctx.lineWidth = 1.3 * rs;
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.stroke();
      ctx.fillStyle = ink(0.95);
      const nd = Math.max(1.2, 3 * rs); // ノード四角の一辺(rs 縮小)
      for (const p of pts) ctx.fillRect(p[0] - nd / 2, p[1] - nd / 2, nd, nd);
      break;
    }
    case 'grid':
    default: {
      // 作品グリッド(小さな四角の集合・一部だけ塗り)。
      const cols = 6;
      const rows = 3;
      const cw = w / cols;
      const ch = h / rows;
      const gGap = Math.max(1, 1.5 * rs); // セル内側の余白(rs 縮小)
      ctx.lineWidth = lw;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = x + c * cw + gGap;
          const gy = y + r * ch + gGap;
          const gw = Math.max(1, cw - gGap * 2);
          const gh = Math.max(1, ch - gGap * 2);
          if (rnd() < 0.5) {
            ctx.fillStyle = ink(0.8);
            ctx.fillRect(gx, gy, gw, gh);
          } else {
            ctx.strokeStyle = ink(0.6);
            ctx.strokeRect(gx, gy, gw, gh);
          }
        }
      }
      break;
    }
  }
}

// ------------------------------------------------------------------
// 淡ディテール層の生成方針(共有・パフォーマンス)
// ------------------------------------------------------------------
// GlassPanel は 5 枚とも異なる accent(5 色)を持つため、淡ディテール層は実質 5 種になり、
// インスタンス間で共有できる同一テクスチャは(このアプリでは)発生しない。
// そこで「refcount 付き共有キャッシュ」のような副作用は持たせず、glowTexture と同様に
//   ・useMemo で 1 度だけ生成(deps 不変なら再生成しない = 再レンダーで作り直さない)
//   ・アンマウント effect で dispose(GPU リソースを確実に解放)
// という単純で StrictMode 安全な方式にする(useMemo 内で副作用=refcount 加算をすると、
// React が factory を破棄/再実行した際に refcount がずれ得るため避ける)。
// 低ティア(low)ではそもそも生成しない(呼び出し側で null)= 段階制御。
