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
  COLUMN_MD_PANEL_SCALE,
} from '../data/panels';
import { GlassPanel } from './GlassPanel';
import { Particles } from './Particles';
import type { QualitySettings } from './quality';

// パネルごとの反射ライトの調整値(3D 目視でユーザーと実機微調整する前提のチューニング定数)。
// offset: パネル中心を基準とした光源位置(右・やや下・手前)。intensity/distance/decay で
// 「自分のパネルだけを柔らかく照らし、Bloom しきい値(0.9)を超えない」ように抑える。
const REFLECT_LIGHT = {
  offset: [0.7, -0.35, 1.4] as [number, number, number],
  intensity: 1.5,
  distance: 2.8,
  decay: 2,
};

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
      {/* ライティング: 柔らかい環境光 + キーライト + パネルごとの反射ライト */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 5]} intensity={1.1} />
      {/* パネルごとの反射ライト(ユーザーFB「5枚それぞれに反射させたい」)。
          旧構成は右下のマゼンタ点光源1つが、その正面に来る CONTACT パネルにだけ鏡面反射(ピンク)を
          落としていた(点光源の反射は光源正面の面にだけ出る性質)。
          → 各パネルの手前に、そのパネルの accent 色の柔らかい点光源を1つずつ置き、
            5枚すべてが自分のネオン色でうっすら反射するようにする。
          ・光源はパネル位置 + REFLECT_LIGHT.offset(手前・やや右下)。
          ・distance を短く + decay=2 で、主に自分のパネルだけを照らす(隣への漏れを抑える)。
          ・intensity は Bloom しきい値(0.9)を超えない柔らかさ(旧 CONTACT の "ちょうど良い"
            反射と同程度の irradiance)に保ち、塊化(ボワッと発光)の再発を防ぐ。
          ・low ティアは負荷を考え反射ライトを省く(環境光 + キーライト + 環境マップのみ)。 */}
      {quality.tier !== 'low' &&
        PANELS.map((panel) => {
          const [px, py, pz] = layout.positions[panel.id] ?? panel.position;
          const [ox, oy, oz] = REFLECT_LIGHT.offset;
          return (
            <pointLight
              key={`reflect-${panel.id}`}
              position={[px + ox, py + oy, pz + oz]}
              color={panel.accent}
              intensity={REFLECT_LIGHT.intensity}
              distance={REFLECT_LIGHT.distance}
              decay={REFLECT_LIGHT.decay}
            />
          );
        })}

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
        // column(スマホ縦)ではパネルを縮小する(ABOUT=横幅フル / 小4枚=交互で小さめ)。
        // panels.ts の sizeMapColumn と同じ縮小率をパネル実寸に掛ける。
        const sizeScale =
          layout.kind === 'column'
            ? panel.size === 'lg'
              ? COLUMN_LG_PANEL_SCALE
              : COLUMN_MD_PANEL_SCALE
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
