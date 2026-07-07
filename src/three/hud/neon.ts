// 発光色の輝度正規化と、装飾メッシュ共通のユーティリティ。
// GlassPanel / hudGeometry / hudTextures から共有する。
import * as THREE from 'three';

// 装飾メッシュをレイキャスト対象から外すための no-op。
// これで当たり判定はガラス本体(cut-corner の立体メッシュ)だけになる。
// 枠外へ張り出す装飾・テクスチャ plate も含め、全装飾にこれを付ける(不変条件)。
export const NO_RAYCAST: THREE.Object3D['raycast'] = () => null;

/** Bloom の発光しきい値(HeroCanvas の luminanceThreshold と一致)。 */
export const BLOOM_THRESHOLD = 0.9;

/** Rec709 相対輝度(linear)。 */
export function luma(c: THREE.Color): number {
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/**
 * three.Color(linear)を Rec709 輝度で「目標輝度」に正規化した HDR 色を返す。
 * accent の色相に依らず、出力の輝度がおおよそ targetLuma になる。
 * targetLuma を閾値 0.9 より十分上に取れば、どの accent でもアイドルで確実に発光する。
 * 暗い色(低輝度)ほど倍率が大きくなるので、過大倍率は cap でクランプする。
 */
export function neonColor(
  base: THREE.Color,
  targetLuma: number,
  cap = 12,
): THREE.Color {
  const l = luma(base);
  const k = l > 1e-4 ? targetLuma / l : targetLuma;
  return base.clone().multiplyScalar(Math.min(k, cap));
}

/**
 * CSS rgba() 文字列を作る(CanvasTexture 描画用)。
 * three.Color は linear を保持するが、canvas 2D は sRGB で描くので、
 * ここでは linear→sRGB 変換した 8bit 値を出す(テクスチャは SRGBColorSpace で読む前提)。
 */
export function cssRGBA(c: THREE.Color, a: number): string {
  // three r155+ は Color を linear で保持。canvas は sRGB なので明示変換する。
  const srgb = c.clone().convertLinearToSRGB();
  const r = Math.round(THREE.MathUtils.clamp(srgb.r, 0, 1) * 255);
  const g = Math.round(THREE.MathUtils.clamp(srgb.g, 0, 1) * 255);
  const b = Math.round(THREE.MathUtils.clamp(srgb.b, 0, 1) * 255);
  return `rgba(${r},${g},${b},${a})`;
}

/** sRGB16 進の色を linear の THREE.Color として得る(three 既定の挙動)。 */
export function color(hex: string): THREE.Color {
  return new THREE.Color(hex);
}
