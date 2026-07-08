// ヒーローの WebGL Canvas ラッパー。
// - 品質ティア判定(useDetectGPU)→ ガラス質感・粒子数・DPR・Bloom を段階調整
// - WebGL 非対応時は fallback を表示
// - Suspense で 3D アセット読み込み中を吸収
// - Error Boundary で WebGL クラッシュから復帰(静止画フォールバックへ)
//
// ネオン HUD の発光は EffectComposer + Bloom(@react-three/postprocessing)で出す。
// 透明キャンバス(DOM 背景=花畑が透ける)を壊さないための条件(analyst 確定):
//   1) gl.alpha = true を維持(下記 Canvas gl.alpha)。
//   2) scene.background を単色に設定しない(未設定のまま)。
//   3) renderer.toneMapping を使わない
//      → rtp の EffectComposer は内部で toneMapping を NoToneMapping に自動設定するため、
//        こちらで何も足さなければ条件を満たす(ToneMapping エフェクトも今回は入れない)。
//   4) EffectComposer は autoClear={false} で描画し、multisampling をティアで変える。
//      postprocessing 6.39 は WebGL コンテキストの alpha を自動検出し、
//      ClearPass が clearAlpha(=0)を尊重して透明背景を維持する。
//   5) low ティアでは EffectComposer 自体を描画しない(Bloom オフ)。
//      その場合でも emissive/HDR ラインは残るので「ネオンっぽさ」は保たれる。
import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDetectGPU, AdaptiveDpr, Preload } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { HeroScene } from './HeroScene';
import { decideTier, settingsForTier, type QualitySettings } from './quality';

interface HeroCanvasProps {
  reducedMotion: boolean;
  onActivate: (to: string) => void;
  hoveredId: string | null;
  /** WebGL クラッシュ時に呼ぶ(親が静止画フォールバックへ切り替える)。 */
  onContextError?: () => void;
}

/**
 * ネオン発光の後処理(Bloom)。
 * 発光対象は「色 or emissiveIntensity を 1 超」にした縁ライン/ブラケット/リング等
 * (GlassPanel 側で HDR 化 + toneMapped=false)。luminanceThreshold(0.9)を超えた
 * 画素だけが発光するので、暗いダークガラス本体は光らず「枠だけネオン」が成立する。
 *
 * ※ low ティアでは呼ばれない(親が EffectComposer ごと描画しない)。
 */
function NeonBloom({ quality }: { quality: QualitySettings }) {
  return (
    <EffectComposer
      // 透明背景を維持するため autoClear は false。
      autoClear={false}
      // MSAA。high=8 / mid=2。
      multisampling={quality.multisampling}
    >
      <Bloom
        // mipmapBlur: 広く柔らかい発光(high のみ)。mid は軽量版。
        mipmapBlur={quality.bloomMipmap}
        // これを超える輝度だけが発光の種になる。ダークガラスは下回る(閾値は不変)。
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        // ユーザーFB②: hover の halo が広く滲んで隣パネルの光と融合するので、広がりを
        //   「最小限」までタイトに(radius 0.62 → 0.4、intensity 0.9/0.72 → 0.8/0.62)。
        //   閾値は据え置きなので idle の細ネオン線・中央の文字/計器は従来どおり発光する。
        intensity={quality.bloomMipmap ? 0.8 : 0.62}
        // 発光の広がり(mipmapBlur 使用/非使用いずれにも効く。小さいほど滲みが狭い)。
        radius={0.4}
      />
    </EffectComposer>
  );
}

/**
 * GPU ティアを Canvas の外側で判定する。
 * DPR 上限(quality.dprMax)は Canvas 生成時に確定させる必要がある:
 *   AdaptiveDpr は負荷回復時に viewport.initialDpr(= Canvas の dpr プロップ)へ戻すため、
 *   マウント後に setDpr で下げても復帰時に上限へ戻されてしまう。よって dpr プロップに焼き込む。
 * useDetectGPU は suspend するので、呼び出し元(HeroCanvas)で <Suspense> に包む。
 */
function HeroCanvasInner({
  reducedMotion,
  onActivate,
  hoveredId,
  onContextError,
}: HeroCanvasProps) {
  const gpu = useDetectGPU();
  const screenWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1280;

  const quality = useMemo<QualitySettings>(() => {
    const tier = decideTier({
      gpuTier: gpu.tier,
      isMobile: !!gpu.isMobile,
      screenWidth,
    });
    return settingsForTier(tier);
  }, [gpu.tier, gpu.isMobile, screenWidth]);

  return (
    <Canvas
      // WebGL 非対応環境では即このフォールバックが出る。
      fallback={
        <div className="flex h-full w-full items-center justify-center text-white/80">
          お使いの環境では 3D 表示を利用できません。
        </div>
      }
      // 影は使わない(変更①): 本体は半透明ダークガラスで背景の花畑は WebGL 外(DOM 画像)。
      // WebGL 内で影を受けるのはパネル本体だけかつ半透明で見えず、影パスは純粋な無駄なので付けない。
      // DPR 上限はティア別(high=2 / mid=1.5 / low=1)。AdaptiveDpr が負荷時にさらに動的に下げる。
      dpr={[1, quality.dprMax]}
      gl={{
        antialias: true,
        // 透明キャンバス(DOM 背景の花畑が透ける)を維持する要。EffectComposer 導入後も不変。
        alpha: true,
        powerPreference: 'high-performance',
        // タブ非表示時などのコンテキストロストを検知して親に通知。
        preserveDrawingBuffer: false,
      }}
      camera={{ position: [0, 0.3, 8], fov: 42 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          (e) => {
            e.preventDefault();
            onContextError?.();
          },
          { once: true },
        );
      }}
    >
      <Suspense fallback={null}>
        <HeroScene
          quality={quality}
          reducedMotion={reducedMotion}
          onActivate={onActivate}
          hoveredId={hoveredId}
        />
        {/* ネオン発光(後処理)。low ティアは描画しない(emissive だけで雰囲気維持)。 */}
        {quality.bloom && <NeonBloom quality={quality} />}
        {/* 負荷が高いフレームで自動的に DPR を落とす(上限は上の dpr プロップ)。 */}
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}

export function HeroCanvas(props: HeroCanvasProps) {
  // useDetectGPU(Canvas 外)が suspend するので Suspense で包む。
  // フォールバックは null(後ろに DOM 背景 TimeBackground が見えるので黒画面にはならない)。
  return (
    <Suspense fallback={null}>
      <HeroCanvasInner {...props} />
    </Suspense>
  );
}
