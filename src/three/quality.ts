// 3D の品質ティア。端末性能に応じてガラスの反射品質・粒子数・DPR を段階調整する。
// useDetectGPU(drei)の結果や画面幅から算出する。
//
// ガラスは「実アルファ透過の色付きガラス」(meshPhysicalMaterial の transparent+opacity)
// に統一した。背景の花畑は WebGL シーン外(DOM の <img>)にあり、
// MeshTransmissionMaterial の屈折(3Dシーン背後をFBOに焼く方式)では透けないため。
// → 全ティアで同じ透過方式(どの端末でもしっかり背景が透ける)。
//   ティアによる差は「環境反射の強さ・粒子数・DPR 上限・Bloom(後処理)」で付ける
//   (透過表現自体はティア非依存で安定)。
//
// ネオン HUD 化(P1): 枠の発光を EffectComposer の Bloom で出す。
//   high = Bloom(mipmapBlur on)+MSAA8 / mid = Bloom(mipmapBlur off)+MSAA2 /
//   low  = Bloom 自体オフ(EffectComposer を描画しない)。
//   low でも emissive/HDR ラインは残るので「ネオンっぽさ」は保たれる。
//   ※ Bloom は透明キャンバスを壊さないよう、scene.background 単色化・
//     renderer.toneMapping を使わず、EffectComposer(autoClear:false)内で処理する。

export type QualityTier = 'high' | 'mid' | 'low';

export interface QualitySettings {
  tier: QualityTier;
  /** ガラスの環境マップ反射の強さ(高いほど艶やかで重い印象)。 */
  envMapIntensity: number;
  /** パーティクル数。 */
  particleCount: number;
  /** デバイスピクセル比の上限。 */
  dprMax: number;
  /**
   * Bloom(ネオン発光の後処理)を有効にするか。
   * low では false(EffectComposer 自体を描画しない)。
   * その場合でも emissive/HDR ライン自体は残るので「ネオンっぽさ」は保たれる。
   */
  bloom: boolean;
  /**
   * Bloom の mipmapBlur を使うか(広く柔らかい発光。やや重い)。
   * high=true / mid=false。low は bloom:false なので無関係。
   */
  bloomMipmap: boolean;
  /**
   * EffectComposer のマルチサンプリング数(MSAA)。
   * high=8 / mid=2 / low=0(bloom オフなので実質未使用)。
   */
  multisampling: number;
}

export function settingsForTier(tier: QualityTier): QualitySettings {
  switch (tier) {
    case 'high':
      return {
        tier,
        envMapIntensity: 1.5,
        particleCount: 90,
        dprMax: 2,
        bloom: true,
        bloomMipmap: true,
        multisampling: 8,
      };
    case 'mid':
      return {
        tier,
        envMapIntensity: 1.3,
        particleCount: 55,
        dprMax: 1.5,
        bloom: true,
        bloomMipmap: false,
        multisampling: 2,
      };
    case 'low':
    default:
      return {
        tier: 'low',
        envMapIntensity: 1.0,
        particleCount: 30,
        dprMax: 1,
        bloom: false,
        bloomMipmap: false,
        multisampling: 0,
      };
  }
}

/**
 * GPU ティア(0-3)・モバイル判定・画面幅から QualityTier を決める。
 * detect-gpu の tier: 0=最低, 1=低, 2=中, 3=高。
 */
export function decideTier(params: {
  gpuTier: number;
  isMobile: boolean;
  screenWidth: number;
}): QualityTier {
  const { gpuTier, isMobile, screenWidth } = params;
  if (gpuTier <= 1) return 'low';
  if (isMobile || screenWidth < 768 || gpuTier === 2) return 'mid';
  return 'high';
}
