// 下層ページ共通の HUD ライトな UI 部品。
// 方針: サイバーパンクは「匂わせ」に留め、読みやすさ最優先(本文は白系・高コントラスト)。
//   - 色は PageShell が配る --page-accent(ページごとのアクセント)を参照する
//   - ライト系ガラス(旧パステル)や slate 系の暗文字は使わない(暗背景に白文字で統一)
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

/** HUD 数値・タグ用の等幅フォント(LoadingScreen と同じスタック)。 */
export const MONO =
  "ui-monospace, 'SF Mono', 'SFMono-Regular', Menlo, 'Roboto Mono', monospace";

/** モノスペースの小さな計器タグ(例: "TRK 01" / "LIVE")。 */
export function MonoTag({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] tracking-[0.18em] text-white/70 ${className}`}
      style={{ fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

/**
 * ダークガラスのカード。上辺にアクセントのヘアラインを敷く(HUD 匂わせ)。
 * pad=false で余白なし(画像カード等、内側で自分で組む用)。
 */
export function HudCard({
  children,
  className = '',
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1526]/65 backdrop-blur-md ${
        pad ? 'p-6' : ''
      } ${className}`}
    >
      {/* 上辺のアクセント・ヘアライン */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            'linear-gradient(90deg, var(--page-accent, #7ff3ff), transparent 65%)',
        }}
      />
      {children}
    </div>
  );
}

/** セクション見出し(アクセントの縦チック + 白見出し)。 */
export function SectionHeading({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-4 flex items-center gap-2.5 text-lg font-semibold text-white ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-4 w-1 -skew-x-12 rounded-[1px]"
        style={{
          background: 'var(--page-accent, #7ff3ff)',
          boxShadow: '0 0 8px var(--page-accent, #7ff3ff)',
        }}
      />
      {children}
    </h2>
  );
}

// アクセント色のボタン共通スタイル(枠線 + うっすら発光。ベタ塗りにはしない)。
const neonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold tracking-wide text-[#eafcff] transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40';
const neonStyle = (subtle = false) => ({
  border: `1px solid color-mix(in srgb, var(--page-accent, #7ff3ff) ${subtle ? 35 : 60}%, transparent)`,
  background: `color-mix(in srgb, var(--page-accent, #7ff3ff) ${subtle ? 7 : 14}%, transparent)`,
  boxShadow: subtle
    ? 'none'
    : '0 0 14px color-mix(in srgb, var(--page-accent, #7ff3ff) 22%, transparent)',
});

/** アクセント発光のリンクボタン(外部/内部リンク)。subtle=控えめ(第二ボタン用)。 */
export function NeonLink({
  subtle = false,
  className = '',
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  subtle?: boolean;
  children: ReactNode;
}) {
  return (
    <a className={`${neonBase} ${className}`} style={neonStyle(subtle)} {...rest}>
      {children}
    </a>
  );
}

/**
 * 和文テキスト用の小さなチップ(スキル名・種別タグ等)。
 * MonoTag は英数の計器タグ専用に保つ(等幅+広字間に和文を入れると崩れるため)。
 * 日本語のラベルはこちらを使う。
 */
export function Chip({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-1 text-xs text-white/85 ${className}`}
    >
      {children}
    </span>
  );
}

/** アクセント発光のボタン。 */
export function NeonButton({
  subtle = false,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  subtle?: boolean;
  children: ReactNode;
}) {
  return (
    <button className={`${neonBase} ${className}`} style={neonStyle(subtle)} {...rest}>
      {children}
    </button>
  );
}
