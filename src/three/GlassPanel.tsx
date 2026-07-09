// ヒーローの半透明ダークガラスパネル(1枚)。プレミアムなネオン HUD(P2 大幅格上げ)。
// - 常時ゆっくり上下浮遊 + 角度ゆらぎ(大パネルは揺れ控えめ)
// - hover で動き停止 + 縁(ふち)のネオンが強く光る(選択中表示)
// - クリックで対応ページへ遷移
// - prefers-reduced-motion では浮遊・HUD の全アニメを止める
// アクセシビリティ: キーボード/SR 操作は Hero.tsx の実リンク層(nav)が担保。
//   マウスの hover/クリックはこの 3D パネルのレイキャストが直接受け取る。
//
// ■ 装飾アーキテクチャ(analyst 方針・"今の 5 倍" の作り込み):
//   細かい 2D 装飾は高解像度の procedural CanvasTexture を主役にする(hud/hudTextures)。
//   2 層構成:
//     (a) 淡いディテール層(<0.9・非発光): 回路トレース/グリッド/薄い罫線/スキャンライン。
//         makeDetailTexture を useMemo で 1 度だけ生成し、アンマウントで dispose(共有キャッシュ
//         や refcount は持たない。5 枚は accent が全て異なるため共有は発生しない)。
//     (b) 発光ディテール層(Bloom 対象・>0.9): テーマ別リードアウト(16進/バー/波形/
//         座標/ステータスタグ/バーコード/進捗)を白マスクで描き、material.color=HDR accent
//         で色付き発光にする。
//   構造的な発光線(枠・ブラケット・目盛り・リング・レジストレーションマーク)は
//   ジオメトリのまま(hud/hudGeometry)。パネル別テーマは hud/hudTheme に集約。
//
// ■ 発光の仕組み(P1→P2 で輝度正規化):
//   縁ライン/リムフレーム/リング/ブラケット/発光テクスチャを HDR 色にし
//   toneMapped={false}(or material.color=HDR)で出す。EffectComposer の Bloom が
//   luminanceThreshold(0.9)を超えた画素だけを発光させる。
//   → ガラス本体(暗色・低 opacity)と淡ディテール層は閾値未満で光らない
//     =「枠 + 発光リードアウトだけ発光」が成立(P1 不変)。neonColor() で accent の色相に
//     依らず idle でも確実に閾値 0.9 を超える(hud/neon)。
//
// ■ hover 判定の要点(P1 不変条件):
//   マウス hover は必ず 3D レイキャスト経由。当たり判定は「ガラス本体(cut-corner の
//   立体メッシュ)のみ」。装飾メッシュ・テクスチャ plate は全て raycast 無効(NO_RAYCAST)。
//   枠外へ張り出す装飾も raycast を持たないので、当たり判定/DOM ホットスポットは本体と一致。
//
// ■ さりげない動き(reduced-motion / low ティアで停止):
//   パネルを走るスキャンライン / リングの微回転 + 周回ドット / ステータス点滅。
//   全て richDecor(mid/high)かつ !reducedMotion のときだけ動く。
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PanelDef } from '../data/panels';
import { panelBaseSize, DECOR_MARGIN } from '../data/panels';
import type { QualitySettings } from './quality';
import { NO_RAYCAST, neonColor } from './hud/neon';
import { themeFor } from './hud/hudTheme';
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
} from './hud/hudGeometry';
import {
  makeDetailTexture,
  makeGlowTexture,
  makeLabelTexture,
  CLEAR_ZONE,
} from './hud/hudTextures';
import { LABEL_FONTS, useLabelFontsReady } from './hud/labelFonts';
import profilePhotoUrl from '../assets/profile/kozaki-kaoru.webp';

// 顔写真(ユーザー提供・webp)。ABOUT パネルの左端にパネル高さいっぱいで飾る。
const PROFILE_PHOTO_AR = 515 / 700; // 左余白を少しカット(515×700・やや縦長)

// 顔写真のカット角シェイプ(本体ローカル座標)。本体パネルの左上=角丸/左下=斜めカットに合わせ
// 左 2 角を落とす(右側はパネル内部なので直線)。左下角からのはみ出し防止(ユーザーFB)。
function profilePhotoShape(
  left: number,
  right: number,
  top: number,
  bottom: number,
  bl: number, // 左下の斜めカット量(左下角だけ落とす。他角は直角)
): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(left + bl, bottom); // 左下カットの右端(下辺スタート)
  s.lineTo(right, bottom); // 下辺 → 右下
  s.lineTo(right, top); // 右辺 → 右上
  s.lineTo(left, top); // 上辺 → 左上(角そのまま=カットなし)
  s.lineTo(left, bottom + bl); // 左辺 ↓
  s.lineTo(left + bl, bottom); // 左下を斜めカットして閉じる
  return s;
}

// drei useTexture は読込中サスペンドするので <Suspense fallback={null}> に包んで使う。
function ProfilePhoto({
  geometry,
  z,
}: {
  geometry: THREE.BufferGeometry;
  z: number;
}) {
  const tex = useTexture(profilePhotoUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh geometry={geometry} position={[0, 0, z]} raycast={NO_RAYCAST}>
      {/* 自然な写真として表示(ネオンの HDR ではなく素の色。既定 toneMapped)。 */}
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface GlassPanelProps {
  panel: PanelDef;
  index: number;
  quality: QualitySettings;
  reducedMotion: boolean;
  onActivate: (to: string) => void;
  /** 外部(DOM リンク hover)からのハイライト。 */
  externalHover: boolean;
  /**
   * この配置での基準位置(x, y, z)。アスペクト比に応じたレスポンシブ配置を
   * 親(HeroScene)が layoutForAspect() で計算して渡す。
   */
  position: [number, number, number];
  /** column レイアウトで大パネルを圧縮する実効スケール(通常 1)。 */
  sizeScale: number;
}

const PANEL_D = 0.12;

// 中央ラベルテクスチャの左パディング(plane 幅に対する割合)。makeLabelTexture の
// usableW = w*0.94 → 左右 padX = (1-0.94)/2 = 0.03 と一致させる。キャプション(サブ行)の
// 左端をラベル文字の視覚左端に揃えるのに使う(左揃え縦積み)。両者を変える時は一緒に直す。
const LABEL_TEX_PAD = 0.03;

// 枠外へ張り出す装飾の最大オフセット(world)。panels.ts の DECOR_MARGIN と一致させ、
// これを超えて張り出さないこと(非重複の数式保証が崩れるため)。
const BRACKET_OUT = 0.1; // コーナー L ブラケットを枠外へ出す量
const BRACKET_TERM = 0.028; // ブラケット腕先の端点ターミナル半サイズ(hudGeometry.makeOuterBracketsGeometry の term と一致)
const NUB_LEN = 0.12; // コネクタ nub の線の長さ(枠外へ)
const NUB_TIP = 0.03; // nub 端点(小さな四角)の半サイズ
const GUIDE_OUT = 0.05; // 最外ガイド輪郭のはみ出し(PANEL+0.1 の輪郭 = 半分の +0.05)

// 枠外へ張り出す装飾の「実際の最大はみ出し量」。DECOR_MARGIN を超えると非重複保証が崩れる。
// 全張り出し要素の端点を計上する: ブラケット(腕先ターミナル込み)/ nub(端点四角込み)/ 最外ガイド輪郭。
// 現状の実測最大は nub の 0.15(NUB_LEN+NUB_TIP)。verify_overhang.mjs が実ジオメトリで再確認する。
const MAX_OVERHANG = Math.max(
  BRACKET_OUT + BRACKET_TERM, // = 0.128
  NUB_LEN + NUB_TIP, // = 0.15(現状の最大)
  GUIDE_OUT, // = 0.05
); // ≈ 0.15
if (import.meta.env.DEV && MAX_OVERHANG > DECOR_MARGIN + 1e-6) {
  // eslint-disable-next-line no-console
  console.error(
    `[GlassPanel] 装飾のはみ出し ${MAX_OVERHANG} が DECOR_MARGIN ${DECOR_MARGIN} を超過。` +
      ' 非重複保証が崩れるので、はみ出し量を下げるか panels.ts の DECOR_MARGIN を上げること。',
  );
}

export function GlassPanel({
  panel,
  index,
  quality,
  reducedMotion,
  onActivate,
  externalHover,
  position,
  sizeScale,
}: GlassPanelProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const active = hovered || externalHover;
  const isLarge = panel.size === 'lg';
  // low ティアは Bloom オフ。過密な細装飾は間引いて軽量に(目盛り/nub/テクスチャ/アニメを省く)。
  const richDecor = quality.tier !== 'low';
  // 動きは richDecor かつ reduced-motion でないときだけ(a11y)。
  const animate = richDecor && !reducedMotion;
  const theme = useMemo(() => themeFor(panel.id), [panel.id]);

  // このパネルの実寸(基準サイズ × sizeScale)。ジオメトリ生成に使う。
  const { w: PANEL_W, h: PANEL_H } = useMemo(() => {
    const base = panelBaseSize(panel.size);
    return { w: base.w * sizeScale, h: base.h * sizeScale };
  }, [panel.size, sizeScale]);

  // ABOUT(プロフィール)パネルだけの特別扱い(ユーザーFB):
  //   ・左端に顔写真をパネル高さいっぱいで飾る(左上=角丸/左下=斜めカットで本体形状に沿わせる)
  //   ・リング撤去 ・名前は写真の右へ(位置固定)。計器は元位置のまま(写真と重なってOK)。
  const isAbout = panel.id === 'about';
  // 顔写真は枠の内側に収める(余白を取り、アスペクト維持で引き伸ばさない)。左下角のみカット。
  const photoMarginY = PANEL_H * 0.045; // 上下の余白(右側の余白に合わせて詰める・ユーザーFB)
  const photoMarginL = PANEL_W * 0.035; // 左の余白
  const photoTop = PANEL_H / 2 - photoMarginY;
  const photoBottom = -PANEL_H / 2 + photoMarginY;
  const photoH = photoTop - photoBottom; // = PANEL_H * 0.86
  const photoW = photoH * PROFILE_PHOTO_AR; // アスペクト維持(引き伸ばさない)
  const photoLeft = -PANEL_W / 2 + photoMarginL;
  const photoRight = photoLeft + photoW;

  // 角丸半径・面取り量。
  const radius = useMemo(() => (isLarge ? 0.13 : 0.1), [isLarge]);
  const cut = useMemo(() => (isLarge ? 0.34 : 0.26), [isLarge]);
  // 顔写真の左下カット量。本体 cut(0.34)より小さくして写真が左下の角をより埋めるようにする
  // (ユーザーFB「アイコン左下の角の余白を少し詰めて」)。本体パネルのカットとは分離する。
  const photoCut = isLarge ? 0.25 : 0.18;

  // 各パネルで浮遊の位相をずらす。
  const phase = useMemo(() => index * 1.3, [index]);
  // 縁・リング・エッジ用の純アクセント色(sRGB→linear で保持)。
  const baseColor = useMemo(() => new THREE.Color(panel.accent), [panel.accent]);

  // ダークガラスのティント(HUD 向け)。accent を暗く lerp し、背景の花畑上でも
  // 半透明のダークガラス板に見せる。暗いので本体は Bloom 閾値未満(枠だけ光る)。
  const glassTint = useMemo(() => {
    const dark = new THREE.Color('#0b1a2a');
    return new THREE.Color(panel.accent).lerp(dark, 0.78);
  }, [panel.accent]);

  // --- 構造ジオメトリ(メモ化 + アンマウントで dispose) ---
  const bodyGeometry = useMemo(
    () => makeCutBodyGeometry(PANEL_W, PANEL_H, PANEL_D, radius, cut),
    [PANEL_W, PANEL_H, radius, cut],
  );
  const outlineGeometry = useMemo(
    () => makeCutOutlineGeometry(PANEL_W, PANEL_H, radius, cut),
    [PANEL_W, PANEL_H, radius, cut],
  );
  const innerOutlineGeometry = useMemo(
    () =>
      makeCutOutlineGeometry(
        PANEL_W - 0.16,
        PANEL_H - 0.16,
        Math.max(0.02, radius - 0.05),
        Math.max(0.02, cut - 0.06),
      ),
    [PANEL_W, PANEL_H, radius, cut],
  );
  // 外側の淡いガイド線(三層ボーダーの一番外)。輪郭のさらに外に薄く。
  const guideOutlineGeometry = useMemo(
    () =>
      makeCutOutlineGeometry(
        PANEL_W + 0.1,
        PANEL_H + 0.1,
        radius + 0.02,
        cut + 0.04,
      ),
    [PANEL_W, PANEL_H, radius, cut],
  );
  // 【E】内側の太い枠面を極細に。二重ボーダーの内側の太線 = この frame 面(border 幅)。
  //   ユーザー FB で存在感を大幅ダウン → border を 0.05 → 0.012(約 1/4 の細線)へ。
  //   外側のネオン枠(outline/bracket)は据え置き。
  const frameGeometry = useMemo(
    () => makeCutFrameGeometry(PANEL_W - 0.06, PANEL_H - 0.06, 0.012, radius, cut),
    [PANEL_W, PANEL_H, radius, cut],
  );
  // 二重 L ブラケット + 端点ターミナル(枠外へ張り出す = 部分発光の主役)。
  const bracketGeometry = useMemo(
    () =>
      makeOuterBracketsGeometry(
        PANEL_W,
        PANEL_H,
        isLarge ? 0.44 : 0.34,
        BRACKET_OUT,
      ),
    [PANEL_W, PANEL_H, isLarge],
  );
  // コーナー・レジストレーションマーク(角のターゲット十字 + 小円)。
  const regMarkGeometry = useMemo(
    // lg(ABOUT)は角からの inset を大きくして、右上マークをサブ情報テキストの真下へ寄せる
    //   (間隔は md と同じ固定でコンパクトに保ち、クラスタ位置だけ内側へ)。
    () => makeRegistrationMarksGeometry(PANEL_W, PANEL_H, isLarge ? 0.56 : 0.42),
    [PANEL_W, PANEL_H, isLarge],
  );
  const nubGeometry = useMemo(
    () => makeConnectorNubsGeometry(PANEL_W, PANEL_H, NUB_LEN, NUB_TIP),
    [PANEL_W, PANEL_H],
  );
  const ticksGeometry = useMemo(
    () => makeScaleTicksGeometry(PANEL_W, PANEL_H, isLarge ? 16 : 10),
    [PANEL_W, PANEL_H, isLarge],
  );
  // ※ シーム線(上下辺内側の横罫線)/ 区切り線(横破線)はユーザー FB(D)で撤去。
  //   枠本体の輪郭線は残し、中央付近を横断する区切り線だけ消してすっきりさせる。
  // リング半径・アイコン・回転目盛り・周回ドット。
  const ringR = isLarge ? 0.3 : 0.24;
  const iconGeometry = useMemo(
    () => makeIconGeometry(theme.icon, ringR),
    [theme.icon, ringR],
  );
  const ringTicksGeometry = useMemo(
    () => makeRingTicksGeometry(ringR, isLarge ? 36 : 28),
    [ringR, isLarge],
  );
  const orbitDotsGeometry = useMemo(
    () => makeOrbitDotsGeometry(ringR, 3),
    [ringR],
  );
  // ※ CTA 矢印(丸囲み「→」)はユーザー FB(D)で撤去。導線は DOM リンク層が担う。

  // --- テクスチャ 2 層 + 中央ラベル ---
  // 解像度はパネル縦横比に合わせる(crisp に見える長辺 ~1024)。パネルにそのまま貼るので
  // アスペクトを一致させ、伸び/潰れを防ぐ。low ティアは生成しない(段階制御)。
  const texDim = useMemo(() => {
    const long = 1024;
    const ar = PANEL_W / PANEL_H;
    return ar >= 1
      ? { tw: long, th: Math.round(long / ar) }
      : { tw: Math.round(long * ar), th: long };
  }, [PANEL_W, PANEL_H]);
  // (a) 淡ディテール層: 回路/グリッド/罫線/スキャンライン(非発光)。useMemo で 1 度だけ生成。
  const detailTexture = useMemo(
    () => (richDecor ? makeDetailTexture(panel.accent, index + 1, texDim.tw, texDim.th) : null),
    [richDecor, panel.accent, index, texDim],
  );
  // (b) 発光ディテール層: テーマ別。白マスク(色は material.color=HDR accent)。
  const glowTexture = useMemo(() => {
    if (!richDecor) return null;
    if (isAbout) {
      // ABOUT(lg)の計器だけ小さくして他パネル(md)に近づける(ユーザーFB)。配置は md クリアゾーン。
      // 当初 md と「見かけ一致」(0.5×md幅/lg幅≈0.31)にしたら小さすぎたので、一回り大きい
      // 0.45 に上げた(ユーザーFB「もう少し大きく」)。他パネルは従来 rs のまま(=普通サイズ)。
      // ABOUT の計器レイアウト(ユーザーFB):
      //  ・下ストリップ(グラフ/統計/バーコード)だけ右へ寄せて写真に被らせない(insetLeft)。
      //    上ストリップ(左上タグ)は元位置のまま動かさない。
      //  ・グラフ(ミニチャート)はもう少し右へ / 数字(統計 hex 行)はもう少し上へ。
      //  ・縮尺は md 相当より一回り大きい 0.45 / 配置は md クリアゾーン。
      return makeGlowTexture(theme, texDim.tw, texDim.th, false, {
        insetLeft: 0.42,
        rs: 0.45,
        zone: CLEAR_ZONE.md,
        chartOffsetX: 0.05,
        hexOffsetY: -0.03,
      });
    }
    return makeGlowTexture(theme, texDim.tw, texDim.th, isLarge);
  }, [richDecor, isAbout, theme, texDim, isLarge]);

  // ------------------------------------------------------------------
  // (A) 中央の日本語ラベル(canvas 2D fillText の発光テクスチャ + 専用 plane)
  // ------------------------------------------------------------------
  // drei Text は日本語不可なので、中央大ラベル(displayLabel)は canvas テクスチャで描く。
  // plane は「左リングの右〜パネル右端手前」= 中央クリアゾーンの右側に置く。テクスチャの
  // 縦横比を plane に一致させ(伸び防止)、makeLabelTexture が幅内に収まるよう自動縮小する。
  // low ティア(richDecor=false)でも中央ラベルは主役なので描く(装飾の間引き対象にしない)。
  // ringR は上で定義済み。ringCX(リング中心 x)はここで定義し、下の走査線/リング配置と共用。
  const ringCX = -PANEL_W / 2 + 0.5; // リング中心 x
  const label = useMemo(() => {
    const marginR = isLarge ? 0.4 : 0.3; // 右端の余白
    const left = ringCX + ringR + 0.28; // ラベル領域の左端(リングの右)
    const right = PANEL_W / 2 - marginR; // ラベル領域の右端
    const planeW = Math.max(0.5, right - left);
    const planeH = isLarge ? 0.72 : 0.46; // クリアゾーン帯に収まる高さ(ABOUTは名前を大きく)
    // plane 中心 x。テクスチャは左寄せ描画(makeLabelTexture)なので、文字は
    //   plane 左端(= left + わずかな安全余白)から始まり、左揃えで読める。
    //   plane 幅はアスペクト一致のため据え置き(縮めると字が横に潰れる)。
    const cx = left + planeW / 2;
    const cy = isLarge ? 0.16 : 0.12; // クリアゾーン帯の縦中央付近
    // テクスチャ解像度(plane 比に一致)。名前の潰れ対策で高解像度化(ユーザーFB)。
    const long = 1024;
    const ar = planeW / planeH;
    const tw = ar >= 1 ? long : Math.round(long * ar);
    const th = ar >= 1 ? Math.round(long / ar) : long;
    return { planeW, planeH, cx, cy, tw, th };
  }, [PANEL_W, isLarge, ringR, ringCX]);

  // ABOUT: 名前ラベル/キャプションを右へ寄せる量(ユーザー「名前はその位置で大丈夫」→ 固定)。
  const labelShiftX = isAbout ? PANEL_W * 0.266 : 0;

  // 顔写真のカット角ジオメトリ + 額縁アウトライン(ABOUT のみ)。
  const photoGeometry = useMemo(() => {
    if (!isAbout) return null;
    const shape = profilePhotoShape(
      photoLeft,
      photoRight,
      photoTop,
      photoBottom,
      photoCut,
    );
    const g = new THREE.ShapeGeometry(shape);
    // UV を外接矩形基準で 0..1 に(画像を歪みなく貼る)。ShapeGeometry 既定 UV は生座標のため上書き。
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    const gw = photoRight - photoLeft;
    const gh = photoTop - photoBottom;
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - photoLeft) / gw;
      uv[i * 2 + 1] = (pos.getY(i) - photoBottom) / gh;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }, [isAbout, photoLeft, photoRight, photoTop, photoBottom, photoCut]);
  const photoFrameGeometry = useMemo(() => {
    if (!isAbout) return null;
    const pts = [
      new THREE.Vector3(photoLeft + photoCut, photoBottom, 0),
      new THREE.Vector3(photoRight, photoBottom, 0),
      new THREE.Vector3(photoRight, photoTop, 0),
      new THREE.Vector3(photoLeft, photoTop, 0),
      new THREE.Vector3(photoLeft, photoBottom + photoCut, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [isAbout, photoLeft, photoRight, photoTop, photoBottom, photoCut]);

  const fontsReady = useLabelFontsReady();
  const labelFont = LABEL_FONTS[panel.labelFont ?? 'system'];
  const labelTexture = useMemo(
    () => makeLabelTexture(panel.displayLabel, label.tw, label.th, labelFont),
    // fontsReady を deps に含める: フォント読込完了(false→true)で正しいフォントに再生成。
    // 値は本体で直接使わないが「変化=再焼き直しのトリガー」なので意図的に残す(lint 抑制)。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panel.displayLabel, label.tw, label.th, labelFont, fontsReady],
  );
  // 名前の縁取り層(全パネル・ユーザーFB「他のパネルにも」)。塗りなし・細ストロークを
  // 塗り層の後ろに濃い同系色で重ね、明るい名前の輪郭を締める。
  const labelOutlineTexture = useMemo(
    () => makeLabelTexture(panel.displayLabel, label.tw, label.th, labelFont, 0.04),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panel.displayLabel, label.tw, label.th, labelFont, fontsReady],
  );
  // ラベルテクスチャはフォント読込後に一度だけ再生成される。差し替え時に旧テクスチャを破棄
  // (他のジオメトリ/テクスチャの巻き添え dispose を避けるため専用 effect に分離する)。
  useEffect(() => () => labelTexture.dispose(), [labelTexture]);
  useEffect(() => () => labelOutlineTexture?.dispose(), [labelOutlineTexture]);

  // アンマウント時に GPU リソースを解放する(全ジオメトリ + テクスチャ)。
  useEffect(
    () => () => {
      bodyGeometry.dispose();
      outlineGeometry.dispose();
      innerOutlineGeometry.dispose();
      guideOutlineGeometry.dispose();
      frameGeometry.dispose();
      bracketGeometry.dispose();
      regMarkGeometry.dispose();
      nubGeometry.dispose();
      ticksGeometry.dispose();
      iconGeometry.dispose();
      ringTicksGeometry.dispose();
      orbitDotsGeometry.dispose();
      glowTexture?.dispose();
      detailTexture?.dispose();
      photoGeometry?.dispose();
      photoFrameGeometry?.dispose();
      // ※ labelTexture の dispose は上の専用 effect に分離済み(ここには含めない)。
    },
    [
      bodyGeometry,
      outlineGeometry,
      innerOutlineGeometry,
      guideOutlineGeometry,
      frameGeometry,
      bracketGeometry,
      regMarkGeometry,
      nubGeometry,
      ticksGeometry,
      iconGeometry,
      ringTicksGeometry,
      orbitDotsGeometry,
      glowTexture,
      detailTexture,
      photoGeometry,
      photoFrameGeometry,
    ],
  );

  // 浮遊の揺れ幅。大パネルは気持ち控えめにする。
  const floatAmp = isLarge ? 0.12 : 0.18;
  const rotAmpX = isLarge ? 0.04 : 0.06;
  const rotAmpY = isLarge ? 0.08 : 0.12;
  const rotAmpZ = isLarge ? 0.02 : 0.03;

  // --- さりげない動きのための ref ---
  const scanRef = useRef<THREE.Mesh>(null); // 走査線(y 移動)
  const ringSpinRef = useRef<THREE.Group>(null); // リング回転目盛り
  const orbitSpinRef = useRef<THREE.Group>(null); // 周回ドット
  const statusRef = useRef<THREE.Mesh>(null); // 点滅ステータス
  const spinProgress = useRef(1); // ホバー1回転アニメの進捗(1=完了/停止)
  const spinArmed = useRef(true); // 1回転の発火可否(発火で false、十分離れたら再武装)
  const unhoverTime = useRef(0); // active=false が続いた時間(再武装の判定用)
  const baseRotY = useRef(0); // rotation.y のベース(浮遊/吸着)。spin と分離し加算暴走を防ぐ

  // リング中心 y(左側)。走査線・アニメで参照(ringCX は上で定義済み)。
  const ringCY = 0.06;

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const [bx, by, bz] = position;
    const t = state.clock.elapsedTime;

    // --- ホバーで素早く右回り奥方向に「1回転だけ」(+Y 回転=右辺が奥へ)。---
    // 回転中はパネル面が cursor から外れて active が一瞬 false→true する。これを新しい
    // ホバーと誤検知して回り続けないよう、「一定時間ちゃんと離れた」時だけ再武装する。
    // 回転中(progress<1)は面が cursor から外れて active が落ちるが、それは "離れた" と
    // カウントしない(回転自体で再武装しないよう、hover中 or 回転中はタイマーを0に保つ)。
    if (active || spinProgress.current < 1) {
      unhoverTime.current = 0;
    } else {
      unhoverTime.current += delta;
      if (unhoverTime.current >= 1.2) spinArmed.current = true; // 十分離れて初めて次の1回転を許可
    }
    // 武装済み・回転していない・hover 中 のときだけ発火(発火で武装解除=1回転で止まる)。
    if (active && spinArmed.current && spinProgress.current >= 1 && !reducedMotion) {
      spinProgress.current = 0;
      spinArmed.current = false;
    }
    const spinning = spinProgress.current < 1 && !reducedMotion;
    if (spinning) {
      spinProgress.current = Math.min(1, spinProgress.current + delta / 0.5); // 0.5s で1回転
    }
    const spinAngle = spinning
      ? (1 - Math.pow(1 - spinProgress.current, 3)) * Math.PI * 2 // easeOutCubic
      : 0;

    // --- 本体の浮遊/hover 吸着(rotation.y のベースは baseRotY に持つ)---
    if (reducedMotion) {
      g.position.set(bx, by, bz);
      g.rotation.set(0, 0, 0);
      baseRotY.current = 0;
    } else if (active) {
      g.position.y = THREE.MathUtils.lerp(g.position.y, by + 0.15, 0.1);
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.1);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.1);
      baseRotY.current = THREE.MathUtils.lerp(baseRotY.current, 0, 0.1);
    } else {
      g.position.y = by + Math.sin(t * 0.6 + phase) * floatAmp;
      g.rotation.x = Math.sin(t * 0.4 + phase) * rotAmpX;
      baseRotY.current = Math.sin(t * 0.5 + phase * 1.4) * rotAmpY;
      g.rotation.z = Math.cos(t * 0.35 + phase) * rotAmpZ;
    }
    // rotation.y = ベース角度 + ホバー1回転(spinAngle)。base を汚さないので加算暴走せず、
    // 2π で base+2π≡base(継ぎ目なし)。回転後もきれいにベースへ戻る。
    g.rotation.y = baseRotY.current + spinAngle;

    // --- HUD の微アニメ(richDecor かつ !reducedMotion のみ)---
    if (!animate) {
      // 停止時は基準状態へ据える(reduced-motion で必ず止まる)。
      if (ringSpinRef.current) ringSpinRef.current.rotation.z = 0;
      if (orbitSpinRef.current) orbitSpinRef.current.rotation.z = 0;
      if (scanRef.current) scanRef.current.visible = false;
      if (statusRef.current) {
        const m = statusRef.current.material as THREE.MeshBasicMaterial;
        m.opacity = 0.9;
      }
      return;
    }
    // 走査線: パネル内側を上下に往復。三角波で y を動かす。
    if (scanRef.current) {
      scanRef.current.visible = true;
      const span = PANEL_H * 0.82;
      const tri = Math.abs(((t * 0.18 + index * 0.13) % 1) * 2 - 1); // 0..1..0
      scanRef.current.position.y = -span / 2 + tri * span;
    }
    // リング回転目盛り(ゆっくり時計回り)/ 周回ドット(逆回りで対比)。
    if (ringSpinRef.current) ringSpinRef.current.rotation.z = -t * 0.25;
    if (orbitSpinRef.current) orbitSpinRef.current.rotation.z = t * 0.5;
    // ステータス点滅(ゆるい明滅・完全には消さない)。
    if (statusRef.current) {
      const m = statusRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3 + index));
    }
  });

  // ------------------------------------------------------------------
  // 発光色(輝度正規化)。accent の色相に依らず idle でも閾値 0.9 を超える。
  // hover は idle より明確に上げるが、halo が広がりすぎない範囲に留める。
  // ------------------------------------------------------------------
  // 外周(枠/ブラケット/エッジ装飾)の発光: ユーザーFB「パネル外側のモヤモヤ発光は
  //   アイドルでは消し、ホバー時だけ出す」。idle 値を Bloom しきい値 0.9 未満(0.8)に下げると
  //   「くっきりした線」だけ残り外周ハロー(モヤモヤ)が消える。active(ホバー)値は据え置きなので
  //   ホバーで従来どおりネオン発光する。※中央の名前/リードアウトは別(idle でも発光を維持)。
  const rimColor = useMemo(() => neonColor(baseColor, active ? 2.2 : 0.8), [baseColor, active]);
  const rimBackColor = useMemo(() => neonColor(baseColor, active ? 1.3 : 0.5), [baseColor, active]);
  const innerRimColor = useMemo(() => neonColor(baseColor, active ? 1.5 : 0.8), [baseColor, active]);
  const guideColor = useMemo(() => neonColor(baseColor, active ? 1.1 : 0.5), [baseColor, active]);
  const frameColor = useMemo(() => neonColor(baseColor, active ? 1.9 : 0.8), [baseColor, active]);
  const bracketColor = useMemo(() => neonColor(baseColor, active ? 2.8 : 0.8), [baseColor, active]);
  const regColor = useMemo(() => neonColor(baseColor, active ? 1.6 : 0.8), [baseColor, active]);
  const nubColor = useMemo(() => neonColor(baseColor, active ? 1.8 : 0.8), [baseColor, active]);
  const tickColor = useMemo(() => neonColor(baseColor, active ? 1.55 : 0.8), [baseColor, active]);
  // リング/種別アイコンも idle は Bloom しきい値未満(0.8)にして、アイドル時のアイコンの
  // モヤモヤ発光漏れを消す(ユーザーFB③)。ホバー(active)では従来どおり発光。
  const ringColor = useMemo(() => neonColor(baseColor, active ? 2.1 : 0.8), [baseColor, active]);
  const ringTickColor = useMemo(() => neonColor(baseColor, active ? 1.7 : 0.8), [baseColor, active]);
  const iconColor = useMemo(() => neonColor(baseColor, active ? 2.2 : 0.8), [baseColor, active]);
  // 中央の日本語ラベル(白マスク × HDR accent)。枠と同様 idle でも発光(>0.9)、本体<0.9。
  // 名前ラベルの発光量(ユーザーFB「小崎薫が潰れる」→ Bloom で滲んで潰れないよう控えめに)。
  // 発光量は全パネル共通(ユーザーFB「一回戻して」)。読みやすさは下の濃い縁取りで担保する。
  // ホバー時の文字色(ユーザーFB): about/works は accent の性質でホバー時に自然と "白に近い"
  // 色になる(理想なのでそのまま=白寄せなし)。それ以外は白へ寄せる量をパネル別に調整する:
  //   music(ミュージック)= 0.2 / career(経歴)・contact(お問い合わせ)= 0(色を残す)。
  // idle は従来どおり各色を保つ。
  const labelColor = useMemo(() => {
    const c = neonColor(baseColor, active ? 1.5 : 1.05);
    const whiten = active && panel.id === 'music' ? 0.2 : 0;
    if (whiten > 0) c.lerp(new THREE.Color(1.5, 1.5, 1.5), whiten);
    return c;
  }, [baseColor, active, panel.id]);
  // 名前の縁取り色 = 各パネルの accent を暗く落とした「濃い同系色」(全パネル・ユーザーFB)。
  // 明るい名前でも輪郭が締まって読める。各パネル固有色に馴染む(固定ピンクだと他色パネルで浮く)。
  // toneMapped 既定のままで Bloom させず輪郭だけ締める。濃さは係数(0.28)で調整可。
  const labelOutlineColor = useMemo(
    () => baseColor.clone().multiplyScalar(0.28),
    [baseColor],
  );
  // 発光リードアウト(白マスク × HDR accent)。idle でも白部分(alpha≈1)が閾値を超える。
  const readoutColor = useMemo(() => neonColor(baseColor, active ? 1.9 : 1.3), [baseColor, active]);
  // 走査線(細い明るい線)。【E】subtle に(target を下げ、opacity と合わせて控えめ発光に)。
  const scanColor = useMemo(() => neonColor(baseColor, active ? 1.15 : 0.85), [baseColor, active]);
  // 点滅ステータス小マーク(旧 arrowColor を流用。矢印撤去後もこのマークは残す)。
  const statusColor = useMemo(() => neonColor(baseColor, active ? 2.3 : 1.45), [baseColor, active]);

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onActivate(panel.to);
      }}
    >
      {/* ダークガラス本体。ここだけがポインタの当たり判定を持つ(装飾は raycast 無効)。
          cut-corner を押し出した立体なので枠線/フレームとシルエットが厳密一致。
          暗い本体は Bloom 閾値未満なので光らない=枠だけネオン発光(P1 不変)。 */}
      <mesh geometry={bodyGeometry}>
        <meshPhysicalMaterial
          color={glassTint}
          transparent
          opacity={active ? 0.46 : 0.38}
          metalness={0}
          roughness={0.3}
          envMapIntensity={quality.envMapIntensity}
          specularIntensity={0.5}
          specularColor="#ffffff"
          clearcoat={0.5}
          clearcoatRoughness={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ===== 三層ボーダー ===== */}
      {/* (最外)淡いガイド線。輪郭のさらに外に薄く。idle は閾値未満(淡いガイド)。 */}
      {richDecor && (
        <lineLoop
          geometry={guideOutlineGeometry}
          position={[0, 0, PANEL_D / 2 + 0.002]}
          raycast={NO_RAYCAST}
        >
          <lineBasicMaterial
            color={guideColor}
            transparent
            opacity={active ? 0.55 : 0.32}
            toneMapped={false}
          />
        </lineLoop>
      )}
      {/* (前面)外側リムライン。カットコーナー輪郭。HDR で Bloom 発光。 */}
      <lineLoop geometry={outlineGeometry} position={[0, 0, PANEL_D / 2]} raycast={NO_RAYCAST}>
        <lineBasicMaterial color={rimColor} transparent opacity={active ? 1 : 0.85} toneMapped={false} />
      </lineLoop>
      {/* (背面)外側リムライン。奥行きの薄い縁取り。idle は控えめ(閾値未満)。 */}
      <lineLoop geometry={outlineGeometry} position={[0, 0, -PANEL_D / 2]} raycast={NO_RAYCAST}>
        <lineBasicMaterial color={rimBackColor} transparent opacity={active ? 0.7 : 0.32} toneMapped={false} />
      </lineLoop>
      {/* (内側)平行ライン。二重ボーダーの淡い方。 */}
      <lineLoop geometry={innerOutlineGeometry} position={[0, 0, PANEL_D / 2 + 0.004]} raycast={NO_RAYCAST}>
        <lineBasicMaterial color={innerRimColor} transparent opacity={active ? 0.8 : 0.5} toneMapped={false} />
      </lineLoop>

      {/* 縁の芯になるリムフレーム面(カットコーナー・細いリング)。線の芯を面で補強。 */}
      <mesh geometry={frameGeometry} position={[0, 0, PANEL_D / 2 + 0.006]} raycast={NO_RAYCAST}>
        <meshBasicMaterial
          color={frameColor}
          transparent
          opacity={active ? 0.78 : 0.34}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* コーナー 二重 L ブラケット + 端点ターミナル(枠の外側へ張り出す)= 部分発光の主役。 */}
      <lineSegments geometry={bracketGeometry} position={[0, 0, PANEL_D / 2 + 0.012]} raycast={NO_RAYCAST}>
        <lineBasicMaterial color={bracketColor} transparent opacity={active ? 1 : 0.95} toneMapped={false} />
      </lineSegments>

      {/* コーナー・レジストレーションマーク(角のターゲット十字 + 小円)。richDecor のみ。 */}
      {richDecor && (
        <lineSegments geometry={regMarkGeometry} position={[0, 0, PANEL_D / 2 + 0.01]} raycast={NO_RAYCAST}>
          <lineBasicMaterial color={regColor} transparent opacity={active ? 0.85 : 0.6} toneMapped={false} />
        </lineSegments>
      )}

      {/* コネクタ nub(枠外へ突き出す短線 + 端の四角)。richDecor のみ。 */}
      {richDecor && (
        <lineSegments geometry={nubGeometry} position={[0, 0, PANEL_D / 2 + 0.01]} raycast={NO_RAYCAST}>
          <lineBasicMaterial color={nubColor} transparent opacity={active ? 0.95 : 0.8} toneMapped={false} />
        </lineSegments>
      )}

      {/* 目盛り(上辺 + 左辺の主/副スケール)。richDecor のみ。 */}
      {richDecor && (
        <lineSegments geometry={ticksGeometry} position={[0, 0, PANEL_D / 2 + 0.01]} raycast={NO_RAYCAST}>
          <lineBasicMaterial color={tickColor} transparent opacity={active ? 0.9 : 0.72} toneMapped={false} />
        </lineSegments>
      )}

      {/* ※ シーム線(上下辺内側の横罫線)/ 区切り線(横破線)は D で撤去(枠輪郭は残す)。 */}

      {/* 内側の色板(hover のみ・ごく僅かな面の色)。idle は完全消灯(面発光ゼロ)。 */}
      <mesh position={[0, 0, -PANEL_D / 2 - 0.01]} raycast={NO_RAYCAST}>
        <planeGeometry args={[PANEL_W * 0.94, PANEL_H * 0.94]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={active ? 0.16 : 0}
          transparent
          opacity={active ? 0.1 : 0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* (a) 淡ディテール層(回路/グリッド/罫線/スキャンライン)。richDecor のみ・非発光。
          低コントラスト・低 opacity のディテールとしてガラス内側に貼る(閾値未満)。 */}
      {detailTexture && (
        <mesh position={[0, 0, -PANEL_D / 2 + 0.002]} raycast={NO_RAYCAST}>
          <planeGeometry args={[PANEL_W * 0.92, PANEL_H * 0.92]} />
          <meshBasicMaterial
            map={detailTexture}
            transparent
            opacity={active ? 0.42 : 0.3}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* (b) 発光ディテール層(テーマ別リードアウト: 16進/バー/波形/座標/ステータス/
          バーコード/進捗)。白マスク × HDR accent(readoutColor)で色付き発光。richDecor のみ。
          前面側に少し浮かせて置く。map の白部分だけが Bloom 閾値超になる。 */}
      {glowTexture && (
        // ABOUT(プロフィール)は顔写真(+0.03)の「前」に計器を出す(ユーザーFB「HUDは写真より前に」)。
        // それ以外のパネルは従来どおり手前に薄く浮かせる(+0.007)。
        <mesh
          position={[0, 0, PANEL_D / 2 + (isAbout ? 0.04 : 0.007)]}
          raycast={NO_RAYCAST}
          frustumCulled={false}
        >
          <planeGeometry args={[PANEL_W * 0.92, PANEL_H * 0.92]} />
          <meshBasicMaterial
            map={glowTexture}
            color={readoutColor}
            transparent
            opacity={active ? 1 : 0.9}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* 走査線(パネル内を上下する細い明るい線)。animate のみ表示・移動。
          reduced-motion / low では visible=false(useFrame で制御)。
          【E】目立ちすぎ FB → opacity を 0.5 → 0.18 に大きく下げ subtle に。アニメ自体は残す。 */}
      {richDecor && (
        <mesh
          ref={scanRef}
          // ABOUT は写真の前(z+0.041)に出して、走査線が写真の上も走るようにする(ユーザーFB)。
          position={[0, 0, PANEL_D / 2 + (isAbout ? 0.041 : 0.009)]}
          raycast={NO_RAYCAST}
          frustumCulled={false}
          visible={false}
        >
          <planeGeometry args={[PANEL_W * 0.9, 0.012]} />
          <meshBasicMaterial color={scanColor} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
      )}

      {/* ===== 左のリングアイコン(発光リング + 種別記号 + 回転目盛り + 周回ドット) =====
          ABOUT(プロフィール)パネルでは顔写真を飾るためリング一式を撤去(ユーザーFB)。 */}
      {!isAbout && (
        <>
          {/* 発光リング(torus)。 */}
          <mesh position={[ringCX, ringCY, PANEL_D / 2 + 0.02]} raycast={NO_RAYCAST}>
            <torusGeometry args={[ringR, 0.028, 12, 32]} />
            <meshBasicMaterial color={ringColor} toneMapped={false} />
          </mesh>
          {/* リング内の種別ラインアート記号(発光ライン)。 */}
          <lineSegments geometry={iconGeometry} position={[ringCX, ringCY, PANEL_D / 2 + 0.024]} raycast={NO_RAYCAST}>
            <lineBasicMaterial color={iconColor} toneMapped={false} />
          </lineSegments>
          {/* リング外周の回転目盛りカラー(ゆっくり回転)。richDecor のみ。 */}
          {richDecor && (
            <group ref={ringSpinRef} position={[ringCX, ringCY, PANEL_D / 2 + 0.022]}>
              <lineSegments geometry={ringTicksGeometry} raycast={NO_RAYCAST}>
                <lineBasicMaterial color={ringTickColor} transparent opacity={active ? 0.9 : 0.7} toneMapped={false} />
              </lineSegments>
            </group>
          )}
          {/* リング周回ドット(逆回り)。richDecor のみ。 */}
          {richDecor && (
            <group ref={orbitSpinRef} position={[ringCX, ringCY, PANEL_D / 2 + 0.024]}>
              <lineSegments geometry={orbitDotsGeometry} raycast={NO_RAYCAST}>
                <lineBasicMaterial color={ringTickColor} toneMapped={false} />
              </lineSegments>
            </group>
          )}
        </>
      )}

      {/* ABOUT: 左端の顔写真(カット角ジオメトリ・パネル高さいっぱい)+ 細い額縁アウトライン。
          写真本体は読込中サスペンド。額縁(ネオン発光ライン)は読込を待たず常時表示。 */}
      {isAbout && photoGeometry && (
        <Suspense fallback={null}>
          <ProfilePhoto geometry={photoGeometry} z={PANEL_D / 2 + 0.03} />
        </Suspense>
      )}
      {isAbout && photoFrameGeometry && (
        <lineLoop
          geometry={photoFrameGeometry}
          position={[0, 0, PANEL_D / 2 + 0.034]}
          raycast={NO_RAYCAST}
        >
          <lineBasicMaterial
            color={rimColor}
            transparent
            opacity={active ? 1 : 0.85}
            toneMapped={false}
          />
        </lineLoop>
      )}

      {/* 名前の縁取り(全パネル・濃い同系色)。renderOrder 2 < 塗り 3 で必ず塗りの後ろに来る。 */}
      {labelOutlineTexture && (
        <mesh
          position={[
            label.cx + labelShiftX,
            label.cy,
            PANEL_D / 2 + (isAbout ? 0.044 : 0.018),
          ]}
          raycast={NO_RAYCAST}
          frustumCulled={false}
          renderOrder={2}
        >
          <planeGeometry args={[label.planeW, label.planeH]} />
          <meshBasicMaterial
            map={labelOutlineTexture}
            color={labelOutlineColor}
            transparent
            opacity={active ? 1 : 0.95}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* (A) 中央の日本語ラベル(canvas fillText テクスチャ)。白マスク × HDR accent(labelColor)
          + toneMapped=false で、既存の発光線と同じ機構でネオン発光(idle でも >0.9)。
          plane は中央クリアゾーンの右側(リングの右〜パネル右端手前)。装飾扱い=raycast 無効・SR 非対象。 */}
      <mesh
        position={[
          label.cx + labelShiftX,
          label.cy,
          // ABOUT は計器(+0.04)より前に名前を出して最前面に保つ。他パネルは従来 +0.02。
          PANEL_D / 2 + (isAbout ? 0.046 : 0.02),
        ]}
        raycast={NO_RAYCAST}
        frustumCulled={false}
        // 半透明の本体(depthWrite=false)より必ず後に描く。浮遊回転で名前の奥行きが
        // 本体より奥へ回り込む瞬間に本体が名前へ被さり、暗くなって発光しきい値を割り
        // 「光が消える」ため、renderOrder で描画順を固定する(ユーザーFB)。
        renderOrder={3}
      >
        <planeGeometry args={[label.planeW, label.planeH]} />
        <meshBasicMaterial
          map={labelTexture}
          color={labelColor}
          transparent
          opacity={active ? 1 : 0.95}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* テーマのキャプション(英字・モノスペース調のサブ行)。日本語ラベルの下に左寄せで縦積み。
          ユーザー FB: センタリング解除 → anchorX=left。x はラベル文字の視覚左端に合わせる
          (plane 左端 + makeLabelTexture の左パディング 0.03*planeW)。タイトル+サブ行が左揃え。 */}
      <Text
        position={[
          label.cx - label.planeW / 2 + label.planeW * LABEL_TEX_PAD + labelShiftX,
          label.cy - label.planeH / 2 - (isLarge ? 0.12 : 0.09),
          PANEL_D / 2 + (isAbout ? 0.046 : 0.02),
        ]}
        fontSize={isLarge ? 0.11 : 0.088}
        letterSpacing={isLarge ? 0.06 : 0.03}
        anchorX="left"
        anchorY="middle"
        raycast={NO_RAYCAST}
        frustumCulled={false}
        renderOrder={3}
      >
        {theme.caption}
        <meshBasicMaterial color={labelColor} toneMapped={false} />
      </Text>

      {/* ※ 右上の番号(01〜05)は D で撤去(表示のみ停止。panels.ts number フィールドは残置)。 */}
      {/* ※ CTA 矢印(丸囲み「→」)は D で撤去。導線は DOM リンク層が担う。 */}

      {/* 点滅ステータス小マーク(右上隅・小さな四角)。animate 時に明滅。
          番号撤去で空いた右上に置く(左上は glowTexture のステータス枠があるので避ける)。 */}
      {richDecor && (
        <mesh
          ref={statusRef}
          // 右上サブ情報テキストの真下へ。md は従来どおり角から 0.3(=1.15, 0.475)。
          //   lg(ABOUT)は角から 0.44 と大きめに取り、テキスト真下・登録マークとコンパクトな間隔で並ぶ。
          position={[
            PANEL_W / 2 - (isLarge ? 0.44 : 0.3),
            PANEL_H / 2 - (isLarge ? 0.44 : 0.3),
            PANEL_D / 2 + 0.02,
          ]}
          raycast={NO_RAYCAST}
          frustumCulled={false}
          renderOrder={3}
        >
          <planeGeometry args={[0.05, 0.05]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.9} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
