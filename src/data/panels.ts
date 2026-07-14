// ヒーローの立体パネル5枚 = サイトのナビゲーション。
// 各ページへの入口。3D パネルにもナビメニューにも同じ定義を使う。
import type { LabelFontKey } from '../three/hud/labelFonts';

export type PanelSize = 'lg' | 'md';

export interface PanelDef {
  id: string;
  /** 遷移先ルート。 */
  to: string;
  /** パネル表面/メニューに出す短いラベル。DOM ナビ/a11y 用(SR が読む)。 */
  label: string;
  /**
   * パネル中央に大きく出す日本語表示ラベル。
   * 3D では canvas 2D fillText テクスチャで発光描画する(drei Text は日本語不可のため)。
   * これは装飾(発光層)なので SR 非対象。読み上げは label(DOM ナビ)側で担保する。
   */
  displayLabel: string;
  /**
   * 英語サブラベル(旧: 中央大ラベルの表示に使用)。
   * 中央大ラベルは displayLabel(日本語)に置換したため、表示用途は廃止。
   * hudTheme の seriesCode 等とは別。互換のため定義は残すが 3D 表示では使わない。
   */
  sub: string;
  /** 一言説明。 */
  description: string;
  /**
   * 3D 空間での既定配置(x, y, z)。横長(デスクトップ)想定の基準値。
   * 実際の配置はビューポートのアスペクト比に応じて layoutForAspect() が上書きする。
   * (メニューやフォールバックなど、配置を問わない用途向けに残している。)
   */
  position: [number, number, number];
  /** パネルの基準色(発光・アクセント)。CSS 変数と揃える。 */
  accent: string;
  /**
   * パネルの大きさ。ネオン HUD 構図では ABOUT を大(lg)・他4枚を小(md)にする。
   * 実寸は PANEL_SIZES を参照(3D パネル・ホットスポット投影で共用)。
   */
  size: PanelSize;
  /** HUD の通し番号表示('01'〜'05')。3D 表示は P2、ここでは定義だけ持つ。 */
  number: string;
  /** 中央ラベルの表示フォント。現在は全パネル 'wdxl' に統一。未指定は system フォント。 */
  labelFont?: LabelFontKey;
}

export const PANELS: PanelDef[] = [
  {
    id: 'about',
    to: '/about',
    label: '自己紹介',
    displayLabel: '小崎 薫',
    sub: 'PROFILE',
    description: 'わたしについて',
    position: [-6.5, 0.55, 0],
    // about=バイオレット/紫(ユーザー採用: works と入替後、紫が好評)。
    accent: '#b14dff',
    size: 'lg',
    number: '01',
    labelFont: 'wdxl',
  },
  {
    id: 'music',
    to: '/music',
    label: '制作楽曲',
    displayLabel: 'MUSIC',
    sub: 'MUSIC',
    description: 'AIでつくった楽曲',
    position: [-3.25, -0.55, 0],
    // エレクトリックシアン。
    accent: '#05d9e8',
    size: 'md',
    number: '02',
    labelFont: 'wdxl',
  },
  {
    id: 'works',
    to: '/works',
    label: '開発作品',
    displayLabel: '開発作品',
    sub: 'WORKS',
    description: '開発した作品たち',
    position: [0, 0.75, 0],
    // works=薄めのクリムゾン(ユーザーFB「クリムゾンで薄目」)。ビビッド #ff2e4c を一段ライトに。
    accent: '#ff5566',
    size: 'md',
    number: '03',
    labelFont: 'wdxl',
  },
  {
    id: 'career',
    to: '/career',
    label: '経歴',
    displayLabel: '経歴',
    sub: 'CAREER',
    description: '案件のあゆみ',
    position: [3.25, -0.55, 0],
    // ネオンアンバー/オレンジ。
    accent: '#ff9e2c',
    size: 'md',
    number: '04',
    labelFont: 'wdxl',
  },
  {
    id: 'contact',
    to: '/contact',
    label: 'お問い合わせ',
    displayLabel: 'お問い合わせ',
    sub: 'CONTACT',
    description: 'ご相談はこちら',
    position: [6.5, 0.55, 0],
    // エレクトリックブルー。
    accent: '#1f8fff',
    size: 'md',
    number: '05',
    labelFont: 'wdxl',
  },
];

// ------------------------------------------------------------------
// パネル実寸(単一の真実)
// ------------------------------------------------------------------
// ここが 3D パネル(GlassPanel)・カメラフィット計算(fitCameraZ)・
// DOM ホットスポット投影(Hero.projectHotspots)すべての共通ソース。
// サイズ拡張はこの一箇所に集約すること(3D と投影がズレると
// 「隣のパネルが光る/フォーカスリングがずれる」不具合の原因になる)。
//
// md = 従来の小パネル寸法。lg = ABOUT 用の大パネル(約 1.5 倍)。
// スマホ縦(columnLayout)では大が画角を圧迫しすぎないよう、
// 実効の大小比を 1.5 → 1.25 に圧縮する(COLUMN_LG_SCALE)。
export const PANEL_SIZES: Record<PanelSize, { w: number; h: number }> = {
  md: { w: 2.9, h: 1.55 },
  // ユーザー実機 FB: ABOUT をもう一回り大きく(4.2×2.9 → 4.7×3.2)。縦長シルエットは維持
  //   (w/h ≈ 1.47 で従来 4.2/2.9 ≈ 1.45 とほぼ同比)。
  // fitCameraZ / レイアウト / Hero.projectHotspots は layout.sizes 経由で自動追従。
  // 新サイズでの非重複は verify_layout.mjs で全アスペクト比・DECOR_MARGIN 込み再検証済み
  //   (wide/portrait/column いずれも重なりゼロ・最小分離スラック > 2×DECOR_MARGIN)。
  lg: { w: 4.7, h: 3.2 }, // 幅は md の約 1.62 倍・高さは約 2.06 倍(縦長ヒーロー)
} as const;

// ------------------------------------------------------------------
// 装飾マージン(枠の外へ張り出す HUD 装飾ぶんの余白)
// ------------------------------------------------------------------
// P2 で、コーナー L ブラケット/コネクタ nub を「枠のわずかに外側」へ張り出す。
// このはみ出しが隣パネルと重なると台無しなので、非重複判定に装飾ぶんの余白を足す。
//
// 重要な役割分担(P1 不変条件を壊さないため):
//   - DECOR_MARGIN は「分離判定(pairSeparated/findOverlaps)」と
//     「カメラフィット(fitCameraZ)= 画角に収める余白」にだけ効かせる。
//   - 当たり判定(GlassPanel の RoundedBox raycast)と DOM ホットスポット
//     (Hero.projectHotspots)は従来どおり“素のパネル実寸”を使う。
//     → 装飾は raycast 無効(NO_RAYCAST)なので、当たり判定/フォーカスリングは
//       ガラス本体と一致したまま。ここに DECOR_MARGIN を混ぜてはいけない。
//
// 値: GlassPanel 側の最大はみ出し量(world 単位)と一致させること。
//   実装(GlassPanel.tsx)の張り出し内訳:
//     コーナー L ブラケットの外側オフセット = 0.10
//     コネクタ nub の全長(線 + 端点)        ≈ 0.16
//   → 最大はみ出し ≈ 0.16。安全側に 0.20 を確保する。
// この余白を各パネルの半幅/半高に足して分離判定するので、
// 「はみ出した装飾どうしが触れても、なお素のパネルは 2×DECOR_MARGIN 以上離れている」
// = はみ出しても重ならないことが数式的に保証される(assertNoOverlap で全レイアウト検証)。
export const DECOR_MARGIN = 0.2;

/** スマホ縦(column)で大パネル(ABOUT)に掛ける縮小率。 */
// 新スマホ配置では ABOUT を「最も広い要素=横幅フル」にするため縮小しない(=1)。
// 小4枚は左右交互にし、その横幅が ABOUT 内に収まるよう配置する。
const COLUMN_LG_SCALE = 1;
// スマホ縦で小4枚(md)に掛ける縮小率。小4枚は ABOUT の横幅内に収まる 2×2 グリッドにする
// (1 + 2×2)。2 枚をちょうど ABOUT 幅に収める(inscribe)ため、
//   グリッド列間 = ABOUT.w - 2*(md.w*SCALE) >= 2*DECOR_MARGIN(=0.4)を満たす最大値。
//   ABOUT.w=4.7・md.w=2.9 → SCALE<=0.741。装飾がぎりぎり触れる程度に詰めて 0.74。
const COLUMN_MD_SCALE = 0.74;

/** レイアウト種別ごとの、パネル id → 実寸(w,h)。 */
type SizeMap = Record<string, { w: number; h: number }>;

/** 通常(wide/portrait)配置での各パネル実寸。 */
function sizeMapDefault(): SizeMap {
  const m: SizeMap = {};
  for (const p of PANELS) m[p.id] = PANEL_SIZES[p.size];
  return m;
}

/** スマホ縦配置での各パネル実寸(lg だけ圧縮)。 */
function sizeMapColumn(): SizeMap {
  const m: SizeMap = {};
  for (const p of PANELS) {
    const base = PANEL_SIZES[p.size];
    m[p.id] =
      p.size === 'lg'
        ? { w: base.w * COLUMN_LG_SCALE, h: base.h * COLUMN_LG_SCALE }
        : { w: base.w * COLUMN_MD_SCALE, h: base.h * COLUMN_MD_SCALE };
  }
  return m;
}

/**
 * 3D パネル(GlassPanel)が自分の実寸を引くための公開ヘルパ。
 * column かどうかは 3D 側では通常意識しないので、既定サイズを返す。
 * (column の縮小は GlassPanel 側で layout.kind を見て scale として掛ける。)
 */
export function panelBaseSize(size: PanelSize): { w: number; h: number } {
  return PANEL_SIZES[size];
}

/** column 配置で lg に掛ける縮小率(GlassPanel が scale に使う)。 */
export const COLUMN_LG_PANEL_SCALE = COLUMN_LG_SCALE;
/** column 配置で md(小4枚)に掛ける縮小率(GlassPanel が scale に使う)。 */
export const COLUMN_MD_PANEL_SCALE = COLUMN_MD_SCALE;

// ------------------------------------------------------------------
// レスポンシブ・レイアウト
// ------------------------------------------------------------------
// 問題: カメラの fov は「垂直」画角。水平画角はアスペクト比に依存するため、
//   縦長/狭幅ビューポートでは横方向の可視幅が急激に狭まり、横一列に広げた
//   パネルが画角からはみ出て見えなくなる。
// 方針: (a) アスペクト比に応じて 3D の世界観を保ったまま
//   ①パネルの配置そのものを組み替え(横長=大ABOUT+小2×2 / 縦長=大+小2×2 / 細長=1列)、
//   ②全パネルが必ず収まる位置までカメラを引く。
//   これで全デバイスで 3D を見せつつ、5 枚すべてが画面内に収まる。

export interface HeroLayout {
  /** パネル id → この配置での 3D 座標。 */
  positions: Record<string, [number, number, number]>;
  /** このレイアウトでの各パネル実寸(w,h)。3D と投影で共用。 */
  sizes: SizeMap;
  /** このアスペクト比で全パネルが収まるカメラ z(視点の引き)。 */
  cameraZ: number;
  /** カメラの基準 y(配置の重心に合わせて上下を微調整)。 */
  cameraY: number;
  /** レイアウト種別(デバッグ・テスト用)。 */
  kind: 'wide' | 'portrait' | 'column';
}

// アスペクト比のしきい値。
//   >= WIDE:    横長 → 左に大ABOUT・右に小4枚(2×2)。デスクトップ〜タブレット横。
//   >= PORTRAIT:やや縦長 → 上に大ABOUT・下に小4枚(2×2)。タブレット縦など。
//   それ未満:   細長い縦 → 大ABOUT最上段 → 小4枚を縦1列。スマホ縦。
const WIDE_ASPECT = 1.15;
const PORTRAIT_ASPECT = 0.62;

// レイアウト設計の不変条件(重なりゼロの根拠):
//   どの 2 枚も「スクリーン投影の矩形」が重ならないこと。
//   投影は遠近だが単調変換なので、3D 空間で 2 枚 a, b について
//     ・|Δx| >= (halfW_a + halfW_b + 2*DECOR_MARGIN)  … x 方向で完全分離、または
//     ・|Δy| >= (halfH_a + halfH_b + 2*DECOR_MARGIN)  … y 方向で完全分離
//   のいずれかを満たせば、投影後も必ず分離する(サイズ可変対応版:
//   分離量 >= 2 枚の半幅/半高の「和」+ 装飾マージン×2 で判定する)。
//   2*DECOR_MARGIN を足すのは、枠の外へ張り出す HUD 装飾(L ブラケット/nub)が
//   隣と触れても、素のパネルどうしはなお離れていることを保証するため。
//   → はみ出し装飾があっても重ならない(P2 のはみ出し演出と非重複を両立)。
//   さらに fitCameraZ(margin) が全枚数を余白付きで画角に収めるため、
//   非隣接ペアも重ならない。assertNoOverlap() で全アスペクト比・全レイアウトを
//   数式的に検証している(下記)。
//   ※ z はすべて 0 に統一(奥行き差で投影サイズが変わり分離余白が崩れるのを防ぐ)。

/**
 * 横長(デスクトップ)配置: 左に大 ABOUT、右側に小 4 枚を 2×2。
 * 参考画像の構図(大きな ABOUT パネル + 小パネル群)を再現する。
 */
function wideLayout(): Pick<HeroLayout, 'positions' | 'kind'> {
  const lg = PANEL_SIZES.lg;
  const md = PANEL_SIZES.md;
  // 大 ABOUT を左に置く。中心 x。
  const aboutX = -3.55;
  // 小 4 枚の 2×2 グリッド中心を右へ。
  // 列間 = md.w + ギャップ、行間 = md.h + ギャップ。
  // 分離条件 |Δ| >= halfW_a+halfW_b + 2*DECOR_MARGIN を満たす(装飾のはみ出し込み)。
  // → colGap >= 2*DECOR_MARGIN(=0.4)、rowGap >= 2*DECOR_MARGIN。余裕を持たせる。
  const colGap = 0.62;
  const rowGap = 0.68;
  const cx = md.w + colGap; // 隣接小パネルの x 間隔(> md.w = halfW+halfW)
  const ry = md.h + rowGap; // 隣接小パネルの y 間隔(> md.h = halfH+halfH)
  // 小グリッドの左端が大パネルと分離するよう右へオフセット。
  // 大の右端 = aboutX + lg.w/2、小の左列中心 = gridCx - cx/2。
  // 両者の間隔が (lg.w/2 + md.w/2 + 2*DECOR_MARGIN) を超えるよう gridCx を決める。
  // 末尾の余白は 2*DECOR_MARGIN(=0.4)を上回る 0.6 とし、装飾込みでも分離を確保。
  const gridCx = aboutX + lg.w / 2 + md.w / 2 + cx / 2 + 0.6;
  return {
    kind: 'wide',
    positions: {
      about: [aboutX, 0, 0],
      music: [gridCx - cx / 2, ry / 2, 0],
      works: [gridCx + cx / 2, ry / 2, 0],
      career: [gridCx - cx / 2, -ry / 2, 0],
      contact: [gridCx + cx / 2, -ry / 2, 0],
    },
  };
}

/**
 * やや縦長(タブレット縦)配置: 上段に大 ABOUT、下に小 4 枚を 2×2。
 */
function portraitLayout(): Pick<HeroLayout, 'positions' | 'kind'> {
  const lg = PANEL_SIZES.lg;
  const md = PANEL_SIZES.md;
  // 装飾のはみ出し込みで分離するよう、ギャップ >= 2*DECOR_MARGIN(=0.4)を確保。
  const colGap = 0.58;
  const rowGap = 0.66;
  const cx = md.w + colGap; // 小 2 列の x 間隔(> md.w + 2*DECOR_MARGIN)
  const ry = md.h + rowGap; // 小 2 行の y 間隔(> md.h + 2*DECOR_MARGIN)
  // 大 ABOUT を上段中央。小グリッドを下段中央。
  // 大の下端 = aboutY - lg.h/2、小上段中心 = gridCy + ry/2。
  // (lg.h/2 + md.h/2 + 2*DECOR_MARGIN) を超える縦間隔を確保する(装飾込み)。
  const gridCy = -1.55;
  const aboutY = gridCy + ry / 2 + lg.h / 2 + md.h / 2 + 0.6;
  return {
    kind: 'portrait',
    positions: {
      about: [0, aboutY, 0],
      music: [-cx / 2, gridCy + ry / 2, 0],
      works: [cx / 2, gridCy + ry / 2, 0],
      career: [-cx / 2, gridCy - ry / 2, 0],
      contact: [cx / 2, gridCy - ry / 2, 0],
    },
  };
}

/**
 * スマホ縦配置: 上=大 ABOUT を横幅フル、その下に小 4 枚を 2×2 グリッド(1 + 2×2)。
 *   旧: 小4枚を左右交互のジグザグ(1枚/行)にしていたが、片側が常に空いて余白が目立つ+
 *       4段で縦に長くカメラが引く→全体が小さい、とユーザーFB。
 *   → 2枚/行のグリッドで横を埋め、行数も 4→2 に減らして縦にコンパクトにする。
 *      カメラが近づき、ABOUT も小4枚のペアも大きく・上下左右の余白も減る。
 * ABOUT を最も広い要素(縮小しない=1)にし、小4枚の 2×2 グリッド外縁を ABOUT の左右端に
 *   合わせる(inscribe)。カメラが ABOUT 幅にフィット → ABOUT 横幅フル、
 *   小4枚のペアが同じ幅を埋める密な構図になる。
 * 列中心 colCx=(ABOUT.w-md.w)/2 で外縁が ABOUT 端と一致。列間=ABOUT.w-2*md.w は
 *   COLUMN_MD_SCALE=0.74 のとき >= 2*DECOR_MARGIN(=0.4)で装飾も重ならない。
 */
function columnLayout(sizes: SizeMap): Pick<HeroLayout, 'positions' | 'kind'> {
  const md = sizes.music; // 小パネル(md)
  const about = sizes.about; // 大パネル(横幅の基準=ヒーロー)
  // 2 列の中心 x。外縁(colCx + md.w/2)を ABOUT 半幅に合わせる(inscribe)。
  const colCx = (about.w - md.w) / 2;
  // 2 行の中心間隔。行間 rowGap は装飾込みで重ならないよう 2*DECOR_MARGIN 以上。
  const rowGap = 0.5;
  const rowStep = md.h + rowGap;
  // グリッド中心 gridCy。その上に ABOUT を gap(0.5)空けて載せる。
  //   ※ camY は内容の外接ボックス中央に自動追従するので gridCy の絶対値は構図に影響しない。
  const gridCy = -1.9;
  const aboutY = gridCy + rowStep / 2 + md.h / 2 + 0.5 + about.h / 2;
  const positions: Record<string, [number, number, number]> = {
    music: [-colCx, gridCy + rowStep / 2, 0],
    works: [colCx, gridCy + rowStep / 2, 0],
    career: [-colCx, gridCy - rowStep / 2, 0],
    contact: [colCx, gridCy - rowStep / 2, 0],
    about: [0, aboutY, 0],
  };
  return { kind: 'column', positions };
}

/**
 * 与えられたパネル配置が「垂直画角 fov・アスペクト比 aspect」のカメラに
 * 余白 margin を確保して全部収まる最小のカメラ z を求める。
 * fov は Three.js と同じ「垂直画角(度)」。
 * パネルごとに実寸(halfW/halfH)と z(奥行き)が違うため、それぞれを見て反復収束させる。
 *
 * 重要: 縁の判定は「実際の投影」と厳密に一致させる。投影(Hero.projectHotspots /
 *   CameraRig)は水平を x=0 基準・垂直を camY 基準で NDC 化するため、
 *   ここでも水平は |x|、垂直は |y - camY| で必要可視量を測る。
 *   (配置の重心が 0 でない=非対称レイアウト[大ABOUT上乗せ等]でも、
 *    カメラを重心 camY に置いた後の実投影で縁がはみ出さないことを保証する。)
 */
export function fitCameraZ(
  positions: Record<string, [number, number, number]>,
  sizes: SizeMap,
  aspect: number,
  fovDeg: number,
  camY: number,
  margin = 1.1,
): number {
  const vfov = (fovDeg * Math.PI) / 180;
  const t = Math.tan(vfov / 2);
  const entries = Object.entries(positions);

  let camZ = 1;
  for (let iter = 0; iter < 64; iter++) {
    let maxNeeded = 0;
    for (const [id, [x, y, z]] of entries) {
      // 装飾(枠外へ張り出す L ブラケット/nub)ぶんを外形に足してから
      // 画角に収める。→ 画面端でも装飾がクリップされない。
      const halfW = sizes[id].w / 2 + DECOR_MARGIN;
      const halfH = sizes[id].h / 2 + DECOR_MARGIN;
      // 水平は x=0 基準、垂直は camY 基準(=投影と同じ原点)。
      const needHalfW = (Math.abs(x) + halfW) * margin;
      const needHalfH = (Math.abs(y - camY) + halfH) * margin;
      // 可視半幅 = t * dist * aspect, 可視半高 = t * dist。
      // これらが必要量以上になる距離 dist を解き、そこへカメラを置く。
      const distForW = needHalfW / (t * aspect);
      const distForH = needHalfH / t;
      const camForThis = Math.max(distForW, distForH) + z;
      if (camForThis > maxNeeded) maxNeeded = camForThis;
    }
    camZ = maxNeeded;
  }
  return camZ;
}

/** 配置の y 重心(カメラの上下位置合わせ用)。 */
function centerY(positions: Record<string, [number, number, number]>): number {
  const ys = Object.values(positions).map(([, y]) => y);
  return ys.reduce((a, b) => a + b, 0) / ys.length;
}

/**
 * ビューポートのアスペクト比(= 幅 / 高さ)から、
 * パネル配置とカメラ(z の引き・y の中心)を決める。
 * Hero の 3D シーンと、DOM ホットスポット層の両方がこれを共有する。
 */
export function layoutForAspect(aspect: number, fovDeg = 42): HeroLayout {
  let base: Pick<HeroLayout, 'positions' | 'kind'>;
  let sizes: SizeMap;
  if (aspect >= WIDE_ASPECT) {
    sizes = sizeMapDefault();
    base = wideLayout();
  } else if (aspect >= PORTRAIT_ASPECT) {
    sizes = sizeMapDefault();
    base = portraitLayout();
  } else {
    sizes = sizeMapColumn();
    base = columnLayout(sizes);
  }

  // 配置の y 重心にカメラを合わせ、パネル群を画面中央に置く。
  // camY を先に確定し、fitCameraZ にも渡す(縁判定を実投影と一致させるため)。
  let cameraY = centerY(base.positions);
  let fitMargin = 1.1;
  if (base.kind === 'column') {
    // スマホ(2×2 グリッド)は下段2枚 + 小4枚に重心(centerY)が引っ張られ、内容の実際の
    //   中心より下に来る。→ 内容の外接ボックス中央を画面中央に合わせ直す(やや上寄せ)。
    //   画面中央の world y = camY*0.4(CameraRig の lookAt が camY*0.4 のため)。
    let top = -Infinity;
    let bottom = Infinity;
    for (const [id, [, y]] of Object.entries(base.positions)) {
      top = Math.max(top, y + sizes[id].h / 2);
      bottom = Math.min(bottom, y - sizes[id].h / 2);
    }
    const midY = (top + bottom) / 2;
    cameraY = (midY - 0.25) / 0.4; // -0.25: 内容をわずかに上へ寄せる
    fitMargin = 1.06; // スマホは端の余白を詰めてパネルを大きく見せる
  }
  const cameraZ = fitCameraZ(base.positions, sizes, aspect, fovDeg, cameraY, fitMargin);

  return { ...base, sizes, cameraZ, cameraY };
}

// ------------------------------------------------------------------
// 非重複の数式的検証(サイズ可変対応)
// ------------------------------------------------------------------
// 2 枚 a, b が「x で分離 or y で分離」のいずれかを満たすかを、
// サイズ可変(半幅/半高の和)で判定する。全ペアで成立すれば投影後も重ならない。
// テスト/開発時の自己検証に使う(本番描画には影響しない)。
export function pairSeparated(
  a: { pos: [number, number, number]; w: number; h: number },
  b: { pos: [number, number, number]; w: number; h: number },
): boolean {
  const dx = Math.abs(a.pos[0] - b.pos[0]);
  const dy = Math.abs(a.pos[1] - b.pos[1]);
  // 各パネルの半幅/半高に DECOR_MARGIN を足して「装飾を含む外形」で判定する。
  // → はみ出し装飾どうしが触れても、素のパネルは 2×DECOR_MARGIN 以上離れる。
  const sepX = dx >= a.w / 2 + b.w / 2 + 2 * DECOR_MARGIN; // 装飾込みの x 分離
  const sepY = dy >= a.h / 2 + b.h / 2 + 2 * DECOR_MARGIN; // 装飾込みの y 分離
  return sepX || sepY;
}

/**
 * あるレイアウトの全パネルペアが分離しているか(重なりゼロ)を検証する。
 * 分離していないペアがあれば [idA, idB] の配列で返す(空なら OK)。
 */
export function findOverlaps(layout: HeroLayout): [string, string][] {
  const ids = Object.keys(layout.positions);
  const bad: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const ok = pairSeparated(
        { pos: layout.positions[a], w: layout.sizes[a].w, h: layout.sizes[a].h },
        { pos: layout.positions[b], w: layout.sizes[b].w, h: layout.sizes[b].h },
      );
      if (!ok) bad.push([a, b]);
    }
  }
  return bad;
}
