// TOP ページの主役。背景の上に WebGL 立体パネル + 粒子を浮かべる。
// - WebGL 可: 3D Canvas を表示し、その手前に「見えないが操作できる実リンク層」を重ねる
//   → キーボード/スクリーンリーダーでも各ページへ確実に到達できる(要件: パネルは実リンク)
// - WebGL 不可/低スペック/?fallback=1: CSS ガラスカードの静止版にフォールバック
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PANELS, layoutForAspect } from '../data/panels';
import { HeroCanvas } from '../three/HeroCanvas';
import { useDeviceCapability } from '../hooks/useDeviceCapability';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { HeroFallback } from './HeroFallback';

// カメラの垂直画角(HeroCanvas の Canvas camera.fov と一致させること)。
const HERO_FOV = 42;

/** ビューポート(内寸)を購読する。DOM ホットスポットの投影に使う。 */
function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export function Hero() {
  const navigate = useNavigate();
  const cap = useDeviceCapability();
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  // WebGL がクラッシュしたら静止画フォールバックへ切り替える。
  const [crashed, setCrashed] = useState(false);

  // 遷移に軽いフェード演出を挟む。
  const go = useCallback(
    (to: string) => {
      if (reducedMotion) {
        navigate(to);
        return;
      }
      setLeaving(true);
      window.setTimeout(() => navigate(to), 280);
    },
    [navigate, reducedMotion],
  );

  // 遷移演出のクリーンアップ(戻ってきた時のため)。
  useEffect(() => setLeaving(false), []);

  const use3D = cap.ready && cap.canRender3D && !crashed;

  // DOM ホットスポット(透明な実リンク層)を 3D パネルの実投影位置に追従させる。
  // 3D シーンと同じ layoutForAspect() + 同じカメラ計算で画面座標へ射影するので、
  // どのアスペクト比でもフォーカスリングが 3D パネルとほぼ一致する。
  const viewport = useViewportSize();
  const hotspots = useMemo(
    () => projectHotspots(viewport.width, viewport.height),
    [viewport.width, viewport.height],
  );

  return (
    <section
      className="relative h-screen w-full overflow-hidden transition-opacity duration-300"
      style={{ opacity: leaving ? 0 : 1 }}
      aria-label="ヒーロー"
    >
      {/* 画面中央の見出しは非表示にし、パネルを主役にする(ユーザー要望)。
          ただしページには見出し(h1)が必要なので、視覚的には隠しつつ
          スクリーンリーダー・SEO 向けに sr-only の h1 を残す。 */}
      <h1 className="sr-only">
        ポートフォリオ — 花畑に、デジタルの光を。
      </h1>

      {/* --- 3D or フォールバック --- */}
      {!cap.ready ? (
        // 判定待ちの一瞬。下地だけ。
        <div className="absolute inset-0" />
      ) : use3D ? (
        <>
          {/* WebGL シーン */}
          <div className="absolute inset-0 z-0">
            <HeroCanvas
              reducedMotion={reducedMotion}
              onActivate={go}
              hoveredId={hoveredId}
              onContextError={() => setCrashed(true)}
            />
          </div>

          {/* アクセシブルな実リンク層(キーボード/SR 専用。視覚的には透明)。
              重要: この層は pointer-events を切って「マウスを素通り」させ、
              マウスの hover / クリックは canvas 側の 3D レイキャストに委ねる。
              → 3D パネルとピクセル単位で一致するので、狙ったパネルだけが反応する。
              (以前はこの DOM ホットスポットの矩形が 3D パネルの見かけ位置とズレており、
               あるパネルにカーソルを乗せると隣のパネルが発光する不具合の原因だった。)
              キーボード操作は pointer-events に依存しないため、Tab フォーカスと
              Enter でのページ遷移はこの層が引き続き担保する。 */}
          <nav
            className="pointer-events-none absolute inset-0 z-10"
            aria-label="ヒーローのパネルナビゲーション"
          >
            <ul className="relative h-full w-full">
              {PANELS.map((p) => (
                <li
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={hotspots[p.id]}
                >
                  <a
                    href={p.to}
                    onClick={(e) => {
                      e.preventDefault();
                      go(p.to);
                    }}
                    // キーボードフォーカス時のみ 3D 側ハイライトに連動(マウスは 3D が担当)。
                    onFocus={() => setHoveredId(p.id)}
                    onBlur={() => setHoveredId(null)}
                    // フォーカス移動は許可しつつマウス操作は素通りさせる。
                    className="pointer-events-none flex h-full w-full flex-col items-center justify-end rounded-2xl pb-4 text-center focus-visible:pointer-events-auto focus-visible:bg-white/5"
                  >
                    {/* SR 用・フォーカス時のみ見えるラベル */}
                    <span className="sr-only">
                      {p.label} — {p.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        // WebGL 不可 → CSS ガラスカードの静止版。
        <HeroFallback onActivate={go} reason={cap.reason} />
      )}

    </section>
  );
}

/**
 * 3D パネルの実投影位置に、透明なリンクのホットスポット(操作域)を重ねる座標を計算する。
 * 3D シーンと同じ layoutForAspect() で配置を求め、同じカメラ(位置・fov)で
 * 各パネルを画面座標へ射影する。これで DOM のフォーカスリングが 3D パネルとほぼ一致する。
 *
 * left/top はパネル中心(<li> 側で -translate 1/2 して中央合わせ)、
 * width/height はそのパネルの投影サイズ。
 */
function projectHotspots(
  vw: number,
  vh: number,
): Record<string, React.CSSProperties> {
  const aspect = vw / vh;
  const layout = layoutForAspect(aspect, HERO_FOV);
  const vfov = (HERO_FOV * Math.PI) / 180;
  const t = Math.tan(vfov / 2);
  const camZ = layout.cameraZ;
  const camY = layout.cameraY;

  const styles: Record<string, React.CSSProperties> = {};
  for (const panel of PANELS) {
    const [x, y, z] = layout.positions[panel.id] ?? panel.position;
    const dist = Math.max(0.001, camZ - z); // カメラからパネル面までの距離
    const halfH = t * dist; // その距離での可視半高
    const halfW = halfH * aspect; // 可視半幅

    // NDC(-1..1)へ。カメラは (0, camY, camZ) で概ね正面を向く前提の近似。
    const ndcX = x / halfW;
    const ndcY = (y - camY) / halfH;

    // 画面座標(%)。y は上下反転。
    const leftPct = 50 + 50 * ndcX;
    const topPct = 50 - 50 * ndcY;

    // パネルの投影サイズ(画面比)。距離が遠いほど小さく写る。
    // 重要: パネルごとの実サイズ(大 ABOUT=lg / 他=md、column では lg 圧縮済み)を
    //   layout.sizes から引く。3D シーン(GlassPanel の実寸)と同じソースなので、
    //   フォーカスリング(このホットスポット)と 3D パネルがピクセル単位で一致する。
    //   ここを共有しないと「隣のパネルが光る/リングがずれる」不具合が再来する。
    const size = layout.sizes[panel.id] ?? { w: 2.9, h: 1.55 };
    const wPct = (size.w / (2 * halfW)) * 100;
    const hPct = (size.h / (2 * halfH)) * 100;

    styles[panel.id] = {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${wPct}%`,
      height: `${hPct}%`,
    };
  }
  return styles;
}
