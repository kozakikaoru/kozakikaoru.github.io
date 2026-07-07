// WebGL 非対応・低スペック・?fallback=1 時のヒーロー静止版。
// 3D の代わりに CSS のガラスモーフィズムでパネル5枚を表現する。
// 背景(TimeBackground)と世界観は共通なので、雰囲気は損なわない。
// ネオン HUD 版に合わせ、ダークガラス(背景が透ける)+ 常時点いたネオン枠 +
// 大 ABOUT + 小 4 枚の構図を CSS で再現する(P1 範囲でできる範囲)。
import { PANELS } from '../data/panels';

interface HeroFallbackProps {
  onActivate: (to: string) => void;
  reason: string | null;
}

export function HeroFallback({ onActivate, reason }: HeroFallbackProps) {
  const about = PANELS.find((p) => p.size === 'lg') ?? PANELS[0];
  const rest = PANELS.filter((p) => p.id !== about.id);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
      <nav aria-label="パネルナビゲーション" className="w-full max-w-4xl">
        {/* 大 ABOUT を上段(横長)、その下に小 4 枚を 2×2。
            md 以上では ABOUT を左に大きく、右に小 4 枚を寄せる。 */}
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 大 ABOUT パネル */}
          <li className="md:row-span-2">
            <a
              href={about.to}
              onClick={(e) => {
                e.preventDefault();
                onActivate(about.to);
              }}
              className="glass-panel group flex h-full min-h-[9rem] w-full flex-col justify-between rounded-2xl p-6 text-left transition-transform duration-300 hover:-translate-y-1"
              style={panelStyle(about.accent)}
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-transform duration-300 group-hover:scale-110"
                  style={{ ...iconStyle(about.accent), color: '#0b1a2a' }}
                >
                  {about.number}
                </span>
                <span
                  className="text-xs font-semibold tracking-[0.3em]"
                  style={{ color: about.accent }}
                >
                  {about.number} {about.sub}
                </span>
              </span>
              <span className="flex flex-col">
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {about.label}
                </span>
                <span className="text-sm text-white/75">
                  {about.description}
                </span>
              </span>
            </a>
          </li>

          {/* 小 4 枚 */}
          {rest.map((p) => (
            <li key={p.id}>
              <a
                href={p.to}
                onClick={(e) => {
                  e.preventDefault();
                  onActivate(p.to);
                }}
                className="glass-panel group flex h-24 w-full flex-row items-center gap-4 rounded-2xl px-5 text-left transition-transform duration-300 hover:-translate-y-1"
                style={panelStyle(p.accent)}
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform duration-300 group-hover:scale-110"
                  style={{ ...iconStyle(p.accent), color: '#0b1a2a' }}
                >
                  {p.number}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className="text-[10px] font-semibold tracking-[0.25em]"
                    style={{ color: p.accent }}
                  >
                    {p.number} {p.sub}
                  </span>
                  <span
                    className="text-lg font-bold text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {p.label}
                  </span>
                  <span className="text-[11px] text-white/70">
                    {p.description}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {/* デバッグ: なぜフォールバックになったか(開発時のみ薄く表示) */}
        {reason && import.meta.env.DEV && (
          <p className="mt-4 text-center text-[10px] text-white/40">
            fallback reason: {reason}
          </p>
        )}
      </nav>
    </div>
  );
}

/**
 * ダークガラスのパネル背景。ネオン HUD 版に合わせ、accent をごく薄く乗せた
 * 「濃いダークガラス」にする(背景の花畑は透ける)。--rim にネオン枠色を渡す。
 */
function panelStyle(accent: string): React.CSSProperties {
  return {
    // ダークネイビー寄りの半透明 + accent をほんのり。3D 版のダークガラスと方針を揃える。
    background: `linear-gradient(135deg, rgba(11,26,42,0.55), rgba(11,26,42,0.4)), linear-gradient(135deg, ${accent}22, ${accent}0a)`,
    // 縁のネオン枠(通常も点いている。hover で glass-panel の :hover が強める)。
    '--rim': accent,
  } as React.CSSProperties;
}

/** アイコンの発光ディスク。 */
function iconStyle(accent: string): React.CSSProperties {
  return {
    background: `radial-gradient(circle at 40% 35%, #ffffffdd, ${accent}66)`,
    boxShadow: `0 0 18px ${accent}88`,
  };
}
