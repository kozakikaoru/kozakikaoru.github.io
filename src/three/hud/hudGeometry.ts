// HUD 構造装飾のジオメトリ生成(発光線が主役)。
// 枠・ブラケット・目盛り・区切り・リング・アイコン・レジストレーションマーク等、
// "構造的な発光線" はジオメトリのまま洗練する(analyst 方針: 淡い細部はテクスチャ、
// 構造線はジオメトリ)。全て BufferGeometry を返し、呼び出し側で dispose する。
//
// 座標系: パネル中心を原点、+x 右 / +y 上 / z=0 平面。lineSegments 用は 2 点で 1 線分。
import * as THREE from 'three';
import type { HudIconKind } from './hudTheme';

// ------------------------------------------------------------------
// 小さなヘルパ
// ------------------------------------------------------------------
/** 線分列(2 点で 1 本)から LineSegments 用ジオメトリを作る。 */
function segGeom(pts: number[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/** 円弧を線分近似して pts に push する。 */
function pushArc(
  pts: number[],
  cx: number,
  cy: number,
  rad: number,
  a0: number,
  a1: number,
  seg = 16,
) {
  for (let i = 0; i < seg; i++) {
    const t0 = a0 + ((a1 - a0) * i) / seg;
    const t1 = a0 + ((a1 - a0) * (i + 1)) / seg;
    pts.push(
      cx + Math.cos(t0) * rad,
      cy + Math.sin(t0) * rad,
      0,
      cx + Math.cos(t1) * rad,
      cy + Math.sin(t1) * rad,
      0,
    );
  }
}

/** 十字(レジストレーションマーク)を pts に push する。 */
function pushCross(pts: number[], cx: number, cy: number, s: number) {
  pts.push(cx - s, cy, 0, cx + s, cy, 0);
  pts.push(cx, cy - s, 0, cx, cy + s, 0);
}

// ------------------------------------------------------------------
// コーナー装飾の対象隅(非対称 HUD)
// ------------------------------------------------------------------
// ユーザー FB: 角の飾り(L ブラケット + レジストレーションマーク)は
//   「右上(TR)と左下(BL)の対角 2 隅だけ」にする(左上・右下は無し)。
// 隅は符号 [sx, sy] で表す(+x 右 / +y 上)。TR=[1,1], BL=[-1,-1]。
// この配列を bracket / registration の両ジェネレータで共有し、
// 生成頂点(=はみ出し・当たり判定・dispose 対象)も 2 隅ぶんに減る。
// 元に戻す/4 隅化する場合はここへ TL=[-1,1], BR=[1,-1] を足すだけでよい。
export const DECOR_CORNERS: readonly [number, number][] = [
  [1, 1], // 右上 TR
  [-1, -1], // 左下 BL
] as const;

// ------------------------------------------------------------------
// カットコーナー角丸長方形のパス(本体・輪郭で共有)
// ------------------------------------------------------------------
/**
 * カットコーナー角丸長方形(HUD 調のメカニカルな輪郭)を Shape/Path に描く。
 * 右上と左下を「斜めカット(面取り)」、左上と右下を角丸にする。反時計回り。
 */
export function traceCutRoundedRect(
  ctx: THREE.Shape | THREE.Path,
  w: number,
  h: number,
  r: number,
  cut: number,
) {
  const left = -w / 2;
  const right = w / 2;
  const bottom = -h / 2;
  const top = h / 2;
  const rad = Math.min(r, w / 2 - cut, h / 2 - cut);
  const c = Math.min(cut, w / 2 - rad, h / 2 - rad);

  ctx.moveTo(left + c, bottom);
  ctx.lineTo(right - rad, bottom);
  ctx.quadraticCurveTo(right, bottom, right, bottom + rad);
  ctx.lineTo(right, top - c);
  ctx.lineTo(right - c, top);
  ctx.lineTo(left + rad, top);
  ctx.quadraticCurveTo(left, top, left, top - rad);
  ctx.lineTo(left, bottom + c);
  ctx.lineTo(left + c, bottom);
}

/** カットコーナー角丸の輪郭線(閉ループ)。lineLoop で描く。本体シルエットに厳密一致。 */
export function makeCutOutlineGeometry(
  width: number,
  height: number,
  radius: number,
  cut: number,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  traceCutRoundedRect(shape, width, height, radius, cut);
  const pts = shape.getPoints(48);
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/** カットコーナー角丸の「枠(リング面)」。外形から内側を穴として抜く。 */
export function makeCutFrameGeometry(
  width: number,
  height: number,
  border: number,
  radius: number,
  cut: number,
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  traceCutRoundedRect(shape, width, height, radius, cut);
  const hole = new THREE.Path();
  traceCutRoundedRect(
    hole,
    width - border * 2,
    height - border * 2,
    Math.max(0.001, radius - border),
    Math.max(0.001, cut - border * 0.5),
  );
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, 24);
}

/** ガラス本体の立体ジオメトリ。cut-corner を depth ぶん押し出した箱(bevel なし)。 */
export function makeCutBodyGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  cut: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  traceCutRoundedRect(shape, width, height, radius, cut);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const zc = (bb.min.z + bb.max.z) / 2;
  geo.translate(0, 0, -zc);
  geo.computeVertexNormals();
  return geo;
}

// ------------------------------------------------------------------
// 二重 L ブラケット + 端点ターミナル(枠外へ張り出す)= 部分発光の主役
// ------------------------------------------------------------------
/**
 * コーナーの「二重 L ブラケット」+ 端点の小四角ターミナルを 1 つの LineSegments に。
 * P2 まで単線だったブラケットを二重化し、端に小さな四角(ターミナル)を足して密度を上げる。
 * 描画する隅は DECOR_CORNERS(現状 TR+BL の対角 2 隅)。非対称 HUD にするため 4 隅→2 隅化。
 *   offset = 枠外へ出す量(BRACKET_OUT)
 *   arm    = 外側 L の腕の長さ
 * 内側 L は外側の一回り内側に、腕を少し短くして平行に走らせる。
 */
export function makeOuterBracketsGeometry(
  width: number,
  height: number,
  arm: number,
  offset: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  const corners = DECOR_CORNERS;
  const inset = 0.05; // 二重線の間隔
  const term = 0.028; // 端点ターミナル(小四角)の半サイズ
  for (const [sx, sy] of corners) {
    // 外側 L の角。
    const oxOut = sx * (width / 2 + offset);
    const oyOut = sy * (height / 2 + offset);
    // 外側 L の 2 本の腕。
    pts.push(oxOut, oyOut, 0, oxOut - sx * arm, oyOut, 0);
    pts.push(oxOut, oyOut, 0, oxOut, oyOut - sy * arm, 0);
    // 内側 L(平行・少し短い)。
    const oxIn = oxOut - sx * inset;
    const oyIn = oyOut - sy * inset;
    const armIn = arm * 0.62;
    pts.push(oxIn, oyIn, 0, oxIn - sx * armIn, oyIn, 0);
    pts.push(oxIn, oyIn, 0, oxIn, oyIn - sy * armIn, 0);
    // 端点ターミナル(外側 L の 2 つの腕先に小四角)。
    const tipH: [number, number] = [oxOut - sx * arm, oyOut]; // 水平腕の先
    const tipV: [number, number] = [oxOut, oyOut - sy * arm]; // 垂直腕の先
    for (const [tx, ty] of [tipH, tipV]) {
      pts.push(tx - term, ty - term, 0, tx + term, ty - term, 0);
      pts.push(tx + term, ty - term, 0, tx + term, ty + term, 0);
      pts.push(tx + term, ty + term, 0, tx - term, ty + term, 0);
      pts.push(tx - term, ty + term, 0, tx - term, ty - term, 0);
    }
  }
  return segGeom(pts);
}

// ------------------------------------------------------------------
// コーナー・レジストレーションマーク(角のターゲット十字)
// ------------------------------------------------------------------
/**
 * コーナー内側に小さなターゲット十字 + 小円を置く(位置合わせマーク風)。
 * ブラケットとは別レイヤ(淡めの発光)で、密度と "計器らしさ" を上げる。
 * 描画する隅は DECOR_CORNERS(ブラケットと同じ TR+BL の対角 2 隅)= 非対称 HUD。
 */
export function makeRegistrationMarksGeometry(
  width: number,
  height: number,
  // 角から内側への距離(呼び出し側が渡す)。間隔は固定でコンパクトに保ちつつ、大パネル(lg=ABOUT)
  //   だけ大きめの値を渡してクラスタを内側=右上サブ情報テキストの真下へ寄せる。md は従来の 0.42。
  inset = 0.42,
): THREE.BufferGeometry {
  const pts: number[] = [];
  const hw = width / 2;
  const hh = height / 2;
  const s = 0.07; // 十字の腕
  const r = 0.05; // 小円
  const corners = DECOR_CORNERS;
  for (const [sx, sy] of corners) {
    const cx = sx * (hw - inset);
    const cy = sy * (hh - inset);
    pushCross(pts, cx, cy, s);
    pushArc(pts, cx, cy, r, 0, Math.PI * 2, 10);
  }
  return segGeom(pts);
}

// ------------------------------------------------------------------
// コネクタ nub(枠のエッジから外へ短い線 + 端の小四角)
// ------------------------------------------------------------------
export function makeConnectorNubsGeometry(
  width: number,
  height: number,
  len: number,
  tip: number,
): THREE.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const pts: number[] = [];
  const nub = (ox: number, oy: number, nx: number, ny: number) => {
    const ex = ox + nx * len;
    const ey = oy + ny * len;
    pts.push(ox, oy, 0, ex, ey, 0);
    const tx = -ny;
    const ty = nx;
    const quad: [number, number][] = [
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
    ].map(([ct, cn]) => [
      ex + (ct * tx + cn * nx) * tip,
      ey + (ct * ty + cn * ny) * tip,
    ]);
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      pts.push(a[0], a[1], 0, b[0], b[1], 0);
    }
  };
  nub(-hw * 0.35, hh, 0, 1);
  nub(hw * 0.55, hh, 0, 1);
  nub(-hw * 0.55, -hh, 0, -1);
  nub(hw * 0.35, -hh, 0, -1);
  nub(hw, hh * 0.25, 1, 0);
  nub(-hw, -hh * 0.25, -1, 0);
  return segGeom(pts);
}

// ------------------------------------------------------------------
// 目盛り(上辺 + 片側辺の主/副スケール)
// ------------------------------------------------------------------
/**
 * 上辺の内側に主/副の刻みを等間隔に並べる。1 本おきに長くして主/副を出す。
 * さらに左辺(内側)にも短い副スケールを添えて "計器の枠" 感を強める。
 */
export function makeScaleTicksGeometry(
  width: number,
  height: number,
  count: number,
): THREE.BufferGeometry {
  const hw = width / 2;
  const hh = height / 2;
  const inset = 0.14;
  const marginX = 0.34;
  const spanX = width - marginX * 2;
  const y0 = hh - inset;
  const pts: number[] = [];
  // 上辺スケール。
  for (let i = 0; i <= count; i++) {
    const x = -hw + marginX + (spanX * i) / count;
    const long = i % 2 === 0;
    const len = long ? 0.1 : 0.055;
    pts.push(x, y0, 0, x, y0 - len, 0);
  }
  // 左辺の副スケール(短め・数本)。番号/リード域を避けて中〜上に。
  const x0 = -hw + inset;
  const vCount = Math.max(4, Math.round(count * 0.5));
  const marginY = 0.5;
  const spanY = height - marginY * 2;
  for (let i = 0; i <= vCount; i++) {
    const y = -hh + marginY + (spanY * i) / vCount;
    const long = i % 2 === 0;
    const len = long ? 0.08 : 0.045;
    pts.push(x0, y, 0, x0 + len, y, 0);
  }
  return segGeom(pts);
}

// ------------------------------------------------------------------
// ※ シーム線(makeSeamLinesGeometry)/ 区切り線(makeDividerGeometry)は
//   ユーザー FB(D)で撤去。中央付近を横断する横罫線を消してすっきりさせるため、
//   生成関数ごと削除した(枠本体の輪郭は makeCutOutlineGeometry が担う)。
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// リング内のパネル種別ラインアート(profile/music/gallery/route/signal)
// ------------------------------------------------------------------
export function makeIconGeometry(
  kind: HudIconKind,
  r: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    pts.push(x1, y1, 0, x2, y2, 0);
  const arc = (
    cx: number,
    cy: number,
    rad: number,
    a0: number,
    a1: number,
    seg = 12,
  ) => pushArc(pts, cx, cy, rad, a0, a1, seg);
  const s = r * 0.82;

  switch (kind) {
    case 'profile': {
      arc(0, s * 0.42, s * 0.3, 0, Math.PI * 2, 14); // 頭
      arc(0, s * -0.55, s * 0.6, Math.PI * 0.15, Math.PI * 0.85, 12); // 肩
      break;
    }
    case 'music': {
      // 8分音符×2(連桁つき)。左右の符幹 + 斜めの二重連桁 + 符頭(小円)。
      const x1 = -s * 0.34;
      const x2 = s * 0.4;
      const t1 = s * 0.52; // 左符幹の上端
      const t2 = s * 0.36; // 右符幹の上端(低め=連桁が斜めになる)
      const h1 = -s * 0.34; // 左符頭の中心 y
      const h2 = -s * 0.22; // 右符頭の中心 y
      line(x1, h1, x1, t1); // 左符幹
      line(x2, h2, x2, t2); // 右符幹
      line(x1, t1, x2, t2); // 連桁(上)
      line(x1, t1 - s * 0.14, x2, t2 - s * 0.14); // 連桁(下・二重)
      arc(x1 - s * 0.1, h1, s * 0.115, 0, Math.PI * 2, 10); // 左符頭
      arc(x2 - s * 0.1, h2, s * 0.115, 0, Math.PI * 2, 10); // 右符頭
      break;
    }
    case 'gallery': {
      // 星(4 方向の光条)+ 中央の小ひし形。
      line(0, -s * 0.62, 0, s * 0.62);
      line(-s * 0.62, 0, s * 0.62, 0);
      line(-s * 0.32, -s * 0.32, s * 0.32, s * 0.32);
      line(-s * 0.32, s * 0.32, s * 0.32, -s * 0.32);
      const d = s * 0.16;
      line(0, d, d, 0);
      line(d, 0, 0, -d);
      line(0, -d, -d, 0);
      line(-d, 0, 0, d);
      break;
    }
    case 'route': {
      // 経路(ジグザグ)+ 目的地ピン。
      line(-s * 0.55, -s * 0.4, -s * 0.15, s * 0.1);
      line(-s * 0.15, s * 0.1, s * 0.2, -s * 0.25);
      line(s * 0.2, -s * 0.25, s * 0.5, s * 0.35);
      arc(s * 0.5, s * 0.45, s * 0.1, 0, Math.PI * 2, 8);
      // 出発ノード。
      arc(-s * 0.55, -s * 0.4, s * 0.07, 0, Math.PI * 2, 8);
      break;
    }
    case 'signal':
    default: {
      // 封筒(枠 + フラップ)。
      const w = s * 0.62;
      const h = s * 0.42;
      line(-w, -h, w, -h);
      line(w, -h, w, h);
      line(w, h, -w, h);
      line(-w, h, -w, -h);
      line(-w, h, 0, -h * 0.15);
      line(0, -h * 0.15, w, h);
      break;
    }
  }
  return segGeom(pts);
}

// ------------------------------------------------------------------
// リングの回転目盛りカラー(リング外周の短い刻み)+ 周回ドット
// ------------------------------------------------------------------
/**
 * リング外周に沿った短い放射状の刻み(計器のダイヤル目盛り)。回転アニメ対象。
 * center を原点とした相対座標で返す(呼び出し側でリング位置へ配置)。
 */
export function makeRingTicksGeometry(
  ringR: number,
  count: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  const rOut = ringR + 0.075;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const long = i % 3 === 0;
    const rIn = ringR + (long ? 0.02 : 0.04);
    pts.push(
      Math.cos(a) * rIn,
      Math.sin(a) * rIn,
      0,
      Math.cos(a) * rOut,
      Math.sin(a) * rOut,
      0,
    );
  }
  return segGeom(pts);
}

/**
 * リング周回ドット(小さな四角の点)を数個、リング半径上に配置。
 * このジオメトリ自体を回転させて "周回" を表現する(reduced-motion で停止)。
 */
export function makeOrbitDotsGeometry(
  ringR: number,
  count: number,
): THREE.BufferGeometry {
  const pts: number[] = [];
  const rd = ringR + 0.055; // ドットの軌道
  const t = 0.02; // ドット半サイズ
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + 0.2;
    const cx = Math.cos(a) * rd;
    const cy = Math.sin(a) * rd;
    pts.push(cx - t, cy - t, 0, cx + t, cy - t, 0);
    pts.push(cx + t, cy - t, 0, cx + t, cy + t, 0);
    pts.push(cx + t, cy + t, 0, cx - t, cy + t, 0);
    pts.push(cx - t, cy + t, 0, cx - t, cy - t, 0);
  }
  return segGeom(pts);
}

// ------------------------------------------------------------------
// ※ CTA 矢印「→」(makeArrowGeometry)はユーザー FB(D)で撤去。
//   右下隅の矢印と関連発光を消し、導線は DOM リンク層に委ねる。
// ------------------------------------------------------------------
