// Canvas 内のヒーローシーン: ライティング + パネル5枚 + 粒子。
// マウス位置に応じてカメラをわずかに動かし、奥行きを演出する。
//
// レスポンシブ: ビューポートのアスペクト比から layoutForAspect() で
//   ①パネルの配置(横長=1行 / 縦長=2〜3行) と ②5枚が収まるカメラの引き(z)
//   を計算し、どのアスペクト比でも 5 枚すべてが画角に収まるようにする。
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import {
  PANELS,
  layoutForAspect,
  COLUMN_LG_PANEL_SCALE,
} from '../data/panels';
import { GlassPanel } from './GlassPanel';
import { Particles } from './Particles';
import type { QualitySettings } from './quality';

interface HeroSceneProps {
  quality: QualitySettings;
  reducedMotion: boolean;
  onActivate: (to: string) => void;
  /** DOM リンクの hover 状態(パネル id → hover)。 */
  hoveredId: string | null;
}

/**
 * カメラのパララックス + レスポンシブな基準位置合わせ。
 * base(z の引き・y の中心)はアスペクト比から決まる値を親から受け取る。
 * reducedMotion 時はパララックスを止め、基準位置へ即座に据える。
 */
function CameraRig({
  reducedMotion,
  baseZ,
  baseY,
}: {
  reducedMotion: boolean;
  baseZ: number;
  baseY: number;
}) {
  const { camera, pointer } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    if (reducedMotion) {
      // モーション抑制: パララックスなしで基準位置に固定。
      camera.position.set(0, baseY, baseZ);
      camera.lookAt(0, baseY * 0.4, 0);
      return;
    }
    // マウス位置に応じて視点をゆっくりずらす(パララックス)。
    // 引き(z)は据え置き、上下左右にだけ軽く振る。
    target.current.set(pointer.x * 0.8, baseY + pointer.y * 0.4, baseZ);
    camera.position.lerp(target.current, 0.04);
    camera.lookAt(0, baseY * 0.4, 0);
  });
  return null;
}

export function HeroScene({
  quality,
  reducedMotion,
  onActivate,
  hoveredId,
}: HeroSceneProps) {
  // ビューポートのアスペクト比(幅/高さ)。リサイズで自動追従する。
  const aspect = useThree((s) => s.viewport.aspect);
  const camera = useThree((s) => s.camera);

  // アスペクト比に応じたパネル配置とカメラの引き。
  const layout = useMemo(() => {
    const fov =
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 42;
    return layoutForAspect(aspect, fov);
  }, [aspect, camera]);

  return (
    <>
      {/* ライティング: 柔らかい環境光 + キーライト + 色付きリムライト */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} castShadow />
      {/* リムライトはサイバーパンク配色に合わせる(シアン/マゼンタ)。
          ガラスがネオン色をうっすら拾い、HUD の世界観と揃う。

          ■ ユーザー実機 FB①(CONTACT 接写「ガラス上のピンクの光の塊」):
          旧 intensity 40/30 は、点光源なので roughness 0.16 のツルツルガラスに
          「集中スペキュラハイライト(点状の鏡面反射)」を作る。renderer.toneMapping は
          NoToneMapping(EffectComposer が設定)なので、そのハイライト輝度は素通しで
          Bloom(luminanceThreshold 0.9)に届き、ボワッと膨らんで色の塊になっていた。
          物理モデル(GGX 直接鏡面 = D_peak·V_SmithGGX·F × 距離減衰 1/d² × 光色×intensity)で
          全パネルの中心スペキュラ輝度を試算すると、旧設定ではどのパネルでも 0.9 を大幅超過
          (例: CONTACT×マゼンタ ≈ 18.6、ABOUT×シアン ≈ 37.7)= 塊化。
          → 対策(併用): ① intensity を 40/30 → 6 に大幅減、
             ② ガラスの roughness 0.16 → 0.30(ハイライトを点でなく柔らかく拡散)、
             ③ specularIntensity 1 → 0.5(F0 を下げてハイライトを弱める)。
          これで面のスペキュラ輝度は「grazing 上界 ≈ 0.39 / 面の現実値 ≈ 0.11」まで下がり、
          閾値 0.9 を確実に下回る(=塊化しない)。一方で intensity 6 の点光源は残すので、
          ガラスは依然シアン/マゼンタの方向性のあるうっすらネオン反射を保つ
          (真っ平ら・真っ暗にはならない)。枠のネオン(HDR ライン/ブラケット)は
          toneMapped=false の別経路なので従来どおり発光する。
          検証: scratchpad/verify_specular2.mjs(全パネル・両リムライト)。 */}
      <pointLight position={[-6, 2, 3]} intensity={6} color="#05d9e8" distance={20} />
      <pointLight position={[6, -2, 3]} intensity={6} color="#ff2d9c" distance={20} />

      {/* 環境マップ: ガラスの反射・屈折に必要。
          外部 HDRI(CDN)に依存しないよう、Lightformer で自前の環境光を構成する。
          → オフライン/ビルド後/CSP でも確実に動く。 */}
      <Environment resolution={256}>
        <Lightformer
          intensity={1.2}
          position={[0, 4, -6]}
          scale={[12, 6, 1]}
          color="#dff3ff"
        />
        <Lightformer
          intensity={0.9}
          position={[-6, 1, 2]}
          scale={[6, 6, 1]}
          color="#a5f3fc"
        />
        {/* 右側の環境反射。ユーザー実機 FB①(右の CONTACT 側のピンク寄り)を踏まえ、
            淡ピンク #f9d5ec → 中性の寒色 #e8ecff へ。面光源(Lightformer)なので
            集中ハイライトにはならず、ガラス右面のうっすら反射から余分なピンク味だけを抜く
            (反射のニュートラル化。全パネルの反射色バランスを寒色寄りに揃える)。 */}
        <Lightformer
          intensity={0.7}
          position={[6, -1, 2]}
          scale={[6, 6, 1]}
          color="#e8ecff"
        />
        {/* 監査 Low / ユーザーの脱緑意図: 淡緑 #c8e6c9 → 寒色/中性 #cfe3ff。
            ガラス反射に乗るごく僅かな緑味を除く。他の Lightformer に緑は無い。 */}
        <Lightformer
          intensity={0.6}
          position={[0, -5, 1]}
          scale={[12, 4, 1]}
          color="#cfe3ff"
        />
      </Environment>

      {/* パネル5枚(配置はアスペクト比に応じて切替) */}
      {PANELS.map((panel, i) => {
        // column(スマホ縦)では大パネル(lg)だけ圧縮する。
        // panels.ts の sizeMapColumn と同じ縮小率をパネル実寸に掛ける。
        const sizeScale =
          layout.kind === 'column' && panel.size === 'lg'
            ? COLUMN_LG_PANEL_SCALE
            : 1;
        return (
          <GlassPanel
            key={panel.id}
            panel={panel}
            index={i}
            quality={quality}
            reducedMotion={reducedMotion}
            onActivate={onActivate}
            externalHover={hoveredId === panel.id}
            position={layout.positions[panel.id] ?? panel.position}
            sizeScale={sizeScale}
          />
        );
      })}

      {/* 光の粒子 */}
      <Particles count={quality.particleCount} reducedMotion={reducedMotion} />

      <CameraRig
        reducedMotion={reducedMotion}
        baseZ={layout.cameraZ}
        baseY={layout.cameraY}
      />
    </>
  );
}
