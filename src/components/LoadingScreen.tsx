// 初期ロード中のローディング画面。サイトの世界観「花畑 × デジタルの光(ネオン HUD)」に合わせ、
// HUD システムの起動シーケンス風に見せる: ダーク背景 + ドリフトするグリッド + 走査線、
// 中央の円形 HUD ゲージ(進捗アーク + 回転目盛り + 中央 % 表示)、四隅のコーナーブラケット、
// 斜めセグメントの進捗バー、進捗に応じて変わるブートログ。
// 進捗(0..1)は zustand ストアから取得。完了後はフェードアウトして DOM から外れる。
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

// HUD 数値・ログ用の等幅フォント(端末標準の mono を使う。技術的な計器表示に寄せる)。
const MONO =
  "ui-monospace, 'SF Mono', 'SFMono-Regular', Menlo, 'Roboto Mono', monospace";

// 進捗アークの円ジオメトリ。
const R = 88; // 進捗アーク半径(viewBox 220x220 の中心 110,110 基準)
const CIRC = 2 * Math.PI * R;

// 四隅のコーナーブラケット(照準枠)。位置クラスと発光する枠線の向きを定義。
const CORNERS: { c: string; s: React.CSSProperties }[] = [
  { c: 'top-5 left-5', s: { borderTop: '2px solid', borderLeft: '2px solid' } },
  { c: 'top-5 right-5', s: { borderTop: '2px solid', borderRight: '2px solid' } },
  { c: 'bottom-5 left-5', s: { borderBottom: '2px solid', borderLeft: '2px solid' } },
  {
    c: 'bottom-5 right-5',
    s: { borderBottom: '2px solid', borderRight: '2px solid' },
  },
];

const PARTICLES = 16; // 舞うデータ粒子
const SEGMENTS = 32; // 進捗バーのセグメント数

// 進捗に応じたブートログ(qualitative なステータス)。
function bootMessage(pct: number): string {
  if (pct < 12) return 'BOOTING SYSTEM';
  if (pct < 30) return 'LOADING ASSETS';
  if (pct < 50) return 'DECODING TEXTURES';
  if (pct < 70) return 'INITIALIZING RENDERER';
  if (pct < 88) return 'CALIBRATING HUD';
  if (pct < 100) return 'FINALIZING';
  return 'SYSTEM ONLINE';
}

export function LoadingScreen() {
  const progress = useAppStore((s) => s.loadProgress);
  const isLoaded = useAppStore((s) => s.isLoaded);
  const [hidden, setHidden] = useState(false);

  // 完了後、フェードアウト演出の時間を待ってから DOM から外す。
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => setHidden(true), 900);
    return () => clearTimeout(t);
  }, [isLoaded]);

  if (hidden) return null;

  const pct = Math.round(progress * 100);
  const litCount = Math.round(progress * SEGMENTS);
  const dashOffset = CIRC * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`読み込み中 ${pct}%`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700"
      style={{
        opacity: isLoaded ? 0 : 1,
        pointerEvents: isLoaded ? 'none' : 'auto',
        background:
          'radial-gradient(120% 90% at 50% 28%, #10233f 0%, #0a0f1c 55%, #070a12 100%)',
        color: '#eafcff',
      }}
    >
      {/* 背景グリッド(ゆっくりドリフト・中央に向けてマスクで淡く) */}
      <div
        className="hud-grid pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(127,243,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(127,243,255,0.09) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage:
            'radial-gradient(ellipse 75% 70% at 50% 45%, #000 0%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 70% at 50% 45%, #000 0%, transparent 78%)',
        }}
      />

      {/* 走査線(CRT 風の細い横縞) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)',
          opacity: 0.5,
        }}
      />

      {/* 上下に走る明るいスキャンライン */}
      <div
        className="hud-scan pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, transparent, rgba(127,243,255,0.85) 45%, rgba(255,45,156,0.6) 55%, transparent)',
          boxShadow: '0 0 12px rgba(127,243,255,0.6)',
        }}
      />

      {/* 舞うデータ粒子(小さな四角) */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: PARTICLES }).map((_, i) => (
          <span
            key={i}
            className="hud-particle absolute block"
            style={{
              left: `${(i * 61) % 100}%`,
              top: `${(i * 41) % 100}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 ? '#ff2d9c' : '#05d9e8',
              boxShadow: `0 0 6px ${i % 3 === 0 ? '#ff2d9c' : '#05d9e8'}`,
              opacity: 0.7,
              animation: `hudFloat ${4 + (i % 5)}s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 四隅のコーナーブラケット(照準枠) */}
      {CORNERS.map((k, i) => (
        <div
          key={i}
          className={`pointer-events-none absolute h-10 w-10 ${k.c}`}
          style={{
            ...k.s,
            borderColor: 'rgba(5,217,232,0.7)',
            boxShadow: '0 0 10px rgba(5,217,232,0.3)',
          }}
        />
      ))}

      {/* ===== 中央: 円形 HUD ゲージ ===== */}
      <div className="relative mb-8 h-[220px] w-[220px]">
        <svg viewBox="0 0 220 220" width="220" height="220" aria-hidden="true">
          <defs>
            <linearGradient id="hudProg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#05d9e8" />
              <stop offset="55%" stopColor="#7ff3ff" />
              <stop offset="100%" stopColor="#ff2d9c" />
            </linearGradient>
          </defs>

          {/* 外周: 回転する目盛りリング */}
          <g
            className="hud-spin"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <circle
              cx="110"
              cy="110"
              r="102"
              fill="none"
              stroke="rgba(127,243,255,0.28)"
              strokeWidth="2"
              strokeDasharray="2 10"
            />
          </g>
          {/* 内側: 逆回転する細いマゼンタの点線リング */}
          <g
            className="hud-spin-rev"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <circle
              cx="110"
              cy="110"
              r="72"
              fill="none"
              stroke="rgba(255,45,156,0.35)"
              strokeWidth="1.5"
              strokeDasharray="1 13"
            />
          </g>

          {/* 進捗トラック(薄い下地) */}
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="rgba(127,243,255,0.12)"
            strokeWidth="4"
          />
          {/* 進捗アーク(12時起点で時計回りに満ちる) */}
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke="url(#hudProg)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 110 110)"
            style={{
              filter:
                'drop-shadow(0 0 5px rgba(5,217,232,0.9)) drop-shadow(0 0 11px rgba(5,217,232,0.4))',
              transition: 'stroke-dashoffset 0.3s ease-out',
            }}
          />

          {/* 進捗リングの上下左右ノード(ディテール) */}
          {[
            [110, 22],
            [198, 110],
            [110, 198],
            [22, 110],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="2.5"
              fill="rgba(127,243,255,0.8)"
            />
          ))}
        </svg>

        {/* 中央の % 数値(SVG の上に HTML で重ねてフォント制御) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span
              className="tabular-nums"
              style={{
                fontFamily: MONO,
                fontSize: '46px',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.04em',
                textShadow: '0 0 14px rgba(5,217,232,0.8)',
              }}
            >
              {pct}
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: '15px',
                fontWeight: 600,
                marginLeft: '2px',
                color: '#05d9e8',
              }}
            >
              %
            </span>
          </div>
          <span
            style={{
              fontFamily: MONO,
              fontSize: '10px',
              letterSpacing: '0.42em',
              marginTop: '6px',
              paddingLeft: '0.42em',
              color: 'rgba(127,243,255,0.55)',
            }}
          >
            LOADING
          </span>
        </div>
      </div>

      {/* ===== タイトル ===== */}
      <h1
        className="hud-flicker"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 6vw, 2.1rem)',
          fontWeight: 600,
          letterSpacing: '0.3em',
          paddingLeft: '0.3em',
          margin: 0,
          color: '#f4fdff',
          textShadow:
            '0 0 18px rgba(5,217,232,0.55), 0 0 42px rgba(5,217,232,0.22), 1.5px 0 0 rgba(255,45,156,0.35)',
        }}
      >
        KOZAKI KAORU
      </h1>
      <p
        style={{
          fontFamily: MONO,
          fontSize: '11px',
          letterSpacing: '0.34em',
          paddingLeft: '0.34em',
          marginTop: '10px',
          color: 'rgba(127,243,255,0.6)',
        }}
      >
        MARGARET FIELD // PORTFOLIO SYSTEM
      </p>

      {/* ===== 斜めセグメントの進捗バー ===== */}
      <div className="mt-8 flex w-72 max-w-[80vw] items-center gap-[3px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const lit = i < litCount;
          const head = i === litCount - 1 && litCount > 0;
          return (
            <span
              key={i}
              className="h-3 flex-1"
              style={{
                transform: 'skewX(-12deg)',
                borderRadius: '1px',
                background: head
                  ? '#ff2d9c'
                  : lit
                    ? '#05d9e8'
                    : 'rgba(127,243,255,0.1)',
                boxShadow: head
                  ? '0 0 9px #ff2d9c'
                  : lit
                    ? '0 0 6px rgba(5,217,232,0.7)'
                    : 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* ===== ブートログ ===== */}
      <p
        className="mt-4"
        style={{
          fontFamily: MONO,
          fontSize: '12px',
          letterSpacing: '0.12em',
          color: 'rgba(234,252,255,0.85)',
        }}
      >
        <span style={{ color: '#05d9e8' }}>&gt;</span> {bootMessage(pct)}
        <span className="hud-cursor" style={{ color: '#05d9e8' }}>
          _
        </span>
      </p>

      <style>{`
        @keyframes hudSpin { to { transform: rotate(360deg); } }
        @keyframes hudFloat {
          0%,100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-22px); opacity: 0.9; }
        }
        @keyframes hudScan {
          0% { transform: translateY(-4vh); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes hudGridDrift { to { background-position: 46px 46px; } }
        @keyframes hudFlicker {
          0%,96%,100% { opacity: 1; }
          97% { opacity: 0.55; }
          98% { opacity: 0.9; }
          99% { opacity: 0.7; }
        }
        @keyframes hudBlink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
        .hud-spin { animation: hudSpin 26s linear infinite; }
        .hud-spin-rev { animation: hudSpin 18s linear infinite reverse; }
        .hud-scan { animation: hudScan 3.4s linear infinite; }
        .hud-grid { animation: hudGridDrift 8s linear infinite; }
        .hud-flicker { animation: hudFlicker 7s steps(1) infinite; }
        .hud-cursor { animation: hudBlink 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hud-spin, .hud-spin-rev, .hud-scan, .hud-grid,
          .hud-flicker, .hud-cursor, .hud-particle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
