// 下層ページ共通のコンテナ(HUD ライト版)。
// TOP の 3D HUD の世界観を「匂わせる」程度に抑え、読みやすさを最優先する:
//   - ヘッダー: Dela 見出しをダークガラスのプレートに載せ、枠外の角ブラケットで装飾
//     (旧: セクションタグのチップ + ヘアライン + アクセント下線はユーザー指示で撤去)
//   - ページごとのアクセント色(パネル accent と揃える)を --page-accent で配下へ配る
//   - 本文カード等は HudKit(HudCard 等)を使う。ライト系ガラス(旧パステル)は使わない
// ページ遷移時に軽いフェードアップ演出(prefers-reduced-motion で無効)。
import type { CSSProperties, ReactNode } from 'react';

/**
 * 文字用のアクセント色(--page-accent-text)。
 *
 * 生アクセントは彩度が高く暗いため、暗いカードの上でも 1.8:1 程度しか出ず
 * 文字には使えない。白を混ぜて明度を揃えた版を用意し、文字はこちらを使う
 * (生アクセントは枠線・グロー・ヘアライン・下線などの装飾専用)。
 * 各色は「カードが背景の白い花の上に載った最悪ケース」で 4.3:1 前後に
 * 揃えてあり、ページを移っても文字の明るさが同じに見えるようにしている。
 */
const ACCENT_TEXT: Record<string, string> = {
  '#b14dff': '#dfb6ff', // about
  '#05d9e8': '#0adae8', // music
  '#ff5566': '#ffb1b9', // works
  '#ff9e2c': '#ffb763', // career
  '#1f8fff': '#96caff', // contact
  '#7ff3ff': '#7ff3ff', // 汎用グロー(元から明るいのでそのまま)
};

interface PageShellProps {
  title: string;
  lead?: string;
  /**
   * ページのアクセント色(パネル accent と揃える)。
   * 未指定は汎用グロー(#7ff3ff)。配下には --page-accent(装飾用)と
   * --page-accent-text(文字用)を配る。
   */
  accent?: string;
  children: ReactNode;
}

export function PageShell({
  title,
  lead,
  accent = '#7ff3ff',
  children,
}: PageShellProps) {
  return (
    <main
      className="relative z-10 mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32"
      style={
        {
          '--page-accent': accent,
          '--page-accent-text':
            ACCENT_TEXT[accent] ?? `color-mix(in srgb, ${accent} 55%, white)`,
        } as CSSProperties
      }
    >
      {/* ページヘッダー(ホームへはヘッダーのサイト名リンクから戻れるため、
          ページ内の「HOME」戻りチップはユーザーFBで撤去) */}
      <header className="mb-10 [animation:var(--animate-fade-up)]">
        {/* 見出しプレート。背景直置きの文字は時間帯によって(特に朝・昼)読めなくなる
            ため、見出し自身にダークガラスの面を持たせる(カードと同じ α0.72)。
            装飾は TOP の 3D パネルの言語を踏襲した「枠外の角ブラケット」(左上・右下)。
            見出しは極太 Dela Gothic One(単一ウェイトなので 400 固定。bold 指定は
            faux-bold で字形が崩れるため使わない)。 */}
        <div className="relative inline-block">
          <h1
            className="rounded-xl border border-white/10 bg-[#0a1526]/72 px-5 py-3 text-3xl text-white backdrop-blur-sm sm:px-6 sm:py-3.5 sm:text-4xl"
            style={{
              fontFamily: "'Dela Gothic One', var(--font-display)",
              fontWeight: 400,
              textShadow: `0 1px 2px rgba(0,0,0,0.45), 0 0 26px ${accent}44`,
            }}
          >
            {title}
          </h1>
          <span
            aria-hidden="true"
            className="absolute -left-1 -top-1 h-4 w-4 rounded-tl-[14px] border-l-2 border-t-2"
            style={{
              borderColor: accent,
              filter: `drop-shadow(0 0 4px ${accent}66)`,
            }}
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-br-[14px] border-b-2 border-r-2"
            style={{
              borderColor: accent,
              filter: `drop-shadow(0 0 4px ${accent}66)`,
            }}
          />
        </div>

        {/* リード文も背景直置きなので、本文の不透明度 + 濃い黒影で読ませる。 */}
        {lead && (
          <p className="text-hud-shadow mt-4 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {lead}
          </p>
        )}
      </header>

      <div className="[animation:var(--animate-fade-up)] [animation-delay:120ms]">
        {children}
      </div>
    </main>
  );
}
