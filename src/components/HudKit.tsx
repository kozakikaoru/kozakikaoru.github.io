// 下層ページ共通の HUD ライトな UI 部品。
// 方針: サイバーパンクは「匂わせ」に留め、読みやすさ最優先(本文は白系・高コントラスト)。
//   - 色は PageShell が配る --page-accent(ページごとのアクセント)を参照する
//   - ライト系ガラス(旧パステル)や slate 系の暗文字は使わない(暗背景に白文字で統一)
//
// 文字色の規約(背景写真は時間帯で朝/昼/夕方/夜に変わり、どの時間帯にも
// マーガレットの「ほぼ白」の領域があるため、文字は必ず自分の面=カードに載せる。
// 背景直置きの白文字は純白でも 1.2:1 程度しか出ない):
//   - 本文        text-white/90
//   - 副次・補足  text-white/75
//   - text-white/60 以下は使わない(可読性が落ちる)
//   - 生アクセント(--page-accent)は装飾専用(枠線・グロー・ヘアライン・下線)。
//     文字色には白を混ぜた --page-accent-text を使う(PageShell が配る)
//   - やむを得ず背景直置きにする文字は text-hud-shadow(濃い黒影)を添える
//
// フォントの前提:
//   - Dela Gothic One は h1 の既存文言だけの 41 字サブセット。ここでは使わない(豆腐になる)
//   - 本文用 Web フォントは未ロード(実体は Hiragino / Yu Gothic 等)。Yu Gothic は
//     400/700 しか無いため font-medium / font-semibold で階層は作れない。
//     階層はサイズ・白の不透明度・余白・字間で作る
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
      className={`inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] tracking-[0.18em] text-white/75 ${className}`}
      style={{ fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

/**
 * ダークガラスのカード。上辺にアクセントのヘアラインを敷く(HUD 匂わせ)。
 * pad=false で余白なし(画像カード等、内側で自分で組む用)。
 *
 * 地色の不透明度 0.72 は、背景写真の「ほぼ白」の領域の上に載っても
 * 本文(text-white/90 = 約 6.3:1)と副次(text-white/75 = 約 5.0:1)が
 * WCAG AA を満たす下限として決めた値。下げると本文が読めなくなる。
 *
 * ※ className で余白を上書きしたい場合は pad={false} を渡すこと。
 *    p-6 と p-5 のような同じプロパティの衝突は、クラスの記述順ではなく
 *    生成 CSS の順序で決まるため、pad を残したままだと意図した方が負ける。
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
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1526]/72 backdrop-blur-md ${
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

/* ============================================================
   リンク用アイコン(自前インライン SVG・依存追加なし)
   色は currentColor で拾うので、置く側が color を決める。
   読み上げ名は必ずリンク側(<a> の aria-label)に付け、SVG は
   aria-hidden + focusable=false にする(SVG 内に <title> を入れると二重読み上げ)。
   ============================================================ */

/** 外部リンク(新しいタブで開く)を表すアイコン。 */
export function IconExternal() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 3.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5A1.25 1.25 0 0 0 3.75 13.5h7.5A1.25 1.25 0 0 0 12.5 12.25V9.5" />
      <path d="M9.5 2.5h4v4" />
      <path d="M13.5 2.5 7.25 8.75" />
    </svg>
  );
}

/** GitHub のマーク(Octicons の mark-github-16 相当)。 */
export function IconGitHub() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-[18px] w-[18px]"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
