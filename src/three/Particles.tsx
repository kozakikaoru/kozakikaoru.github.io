// 空間に漂う光の粒子(花畑にデジタルの光)。
//  ・ambient: drei Sparkles 2層。サイズを per-particle 配列にして少しばらけさせる(ユーザーFB)。
//    ※ Sparkles は位置ドリフトのみで明滅は無い(シェーダを確認済み)。
//  ・twinkle: 自前 Points シェーダ。周期・位相を粒ごとにランダム化し、"時折どこかが
//    ゆっくり強く光る" 演出(同じ箇所が続かないようランダム)。ピーク時は HDR + additive で
//    Bloom 発光、通常は淡い点。
//  reduced-motion: Sparkles speed=0 / twinkle uMotion=0(静止・淡い)。
import { useEffect, useMemo, useRef } from 'react';
import { Sparkles } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  count: number;
  reducedMotion: boolean;
}

// base を中心に ±spread のランダムサイズ配列(ほんの少しばらける)。
function sizeArray(count: number, base: number, spread: number): Float32Array {
  const a = new Float32Array(Math.max(1, count));
  for (let i = 0; i < a.length; i++) {
    a[i] = base * (1 - spread + Math.random() * spread * 2);
  }
  return a;
}

// またたき星(自前 Points)。周期ごとに1回だけ鋭く発光(pow で尖らせる)し、
// 位相・周期を粒ごとにランダムにすることで「時折どこかが強く光る/同じ箇所が続かない」を作る。
const TWINKLE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBase;
  uniform float uPeak;
  uniform float uMotion;
  attribute float aScale;
  attribute float aPhase;
  attribute float aPeriod;
  attribute vec3 aSeed;
  varying float vBright;
  void main() {
    float t = uTime * uMotion;
    vec4 mp = modelMatrix * vec4(position, 1.0);
    mp.y += sin(t * 0.25 + aSeed.x * 6.2831) * 0.22 * uMotion;
    mp.x += cos(t * 0.20 + aSeed.y * 6.2831) * 0.22 * uMotion;
    vec4 vp = viewMatrix * mp;
    gl_Position = projectionMatrix * vp;
    gl_PointSize = aScale * 25.0 * uPixelRatio * (1.0 / -vp.z);
    float ph = fract(t / aPeriod + aPhase);
    float spike = pow(max(0.0, sin(ph * 3.14159265)), 6.0);
    vBright = uBase + uPeak * spike * uMotion;
  }
`;

const TWINKLE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vBright;
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / d - 0.1;
    if (strength <= 0.0) discard;
    gl_FragColor = vec4(uColor * vBright, strength);
  }
`;

function TwinkleStars({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const n = Math.max(1, count);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const scale = new Float32Array(n);
    const phase = new Float32Array(n);
    const period = new Float32Array(n);
    const seed = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7 + 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      scale[i] = 3.5 + Math.random() * 4.5; // 少し大きめ・サイズもばらける
      phase[i] = Math.random(); // 位相ランダム(同じ箇所が続かない)
      period[i] = 6 + Math.random() * 10; // 6〜16s のゆっくり周期(ばらける)
      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aPeriod', new THREE.BufferAttribute(period, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    return g;
  }, [count]);

  // uniforms は一度だけ作り、可変分は useFrame で更新する(prop 差し替えの取りこぼし回避)。
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color('#dbf7ff') },
      uBase: { value: 0.22 }, // 通常時(淡い・Bloom 未満)
      uPeak: { value: 1.7 }, // ピーク時(HDR で Bloom 発光)
      uMotion: { value: 1 },
    }),
    [],
  );

  useFrame((state) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    m.uniforms.uPixelRatio.value = dpr;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={TWINKLE_VERT}
        fragmentShader={TWINKLE_FRAG}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Particles({ count, reducedMotion }: ParticlesProps) {
  const frontCount = count;
  const backCount = Math.round(count * 0.6);
  const twinkleCount = Math.max(10, Math.round(count * 0.3));
  const frontSizes = useMemo(() => sizeArray(frontCount, 2.4, 0.22), [frontCount]);
  const backSizes = useMemo(() => sizeArray(backCount, 4, 0.22), [backCount]);

  return (
    <>
      {/* 手前の細かい粒(白〜シアン)。サイズは少しばらける。 */}
      <Sparkles
        count={frontCount}
        scale={[14, 6, 6]}
        size={frontSizes}
        speed={reducedMotion ? 0 : 0.35}
        opacity={0.7}
        color="#a5f3fc"
        position={[0, 0.5, 1]}
      />
      {/* 奥のふんわりした粒(暖色)。サイズは少しばらける。 */}
      <Sparkles
        count={backCount}
        scale={[16, 8, 4]}
        size={backSizes}
        speed={reducedMotion ? 0 : 0.2}
        opacity={0.4}
        color="#fef9ec"
        position={[0, 1, -2]}
      />
      {/* ゆっくりランダムに強く光る またたき星。 */}
      <TwinkleStars count={twinkleCount} reducedMotion={reducedMotion} />
    </>
  );
}
