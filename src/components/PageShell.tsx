// 下層ページ共通のコンテナ(HUD ライト版)。
// TOP の 3D HUD の世界観を「匂わせる」程度に抑え、読みやすさを最優先する:
//   - ヘッダー: セクションタグのチップ + ヘアライン + Dela 見出し + アクセント下線
//   - ページごとのアクセント色(パネル accent と揃える)を --page-accent で配下へ配る
//   - 本文カード等は HudKit(HudCard 等)を使う。ライト系ガラス(旧パステル)は使わない
// ページ遷移時に軽いフェードアップ演出(prefers-reduced-motion で無効)。
import type { CSSProperties, ReactNode } from 'react';
import { MONO } from './HudKit';

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
  /** 英語セクション名(ヘッダーのタグチップに表示する)。 */
  sub: string;
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
  sub,
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
        {/* セクションタグ(計器ラベル風のチップ)+ ヘアライン。
            背景直置きの色文字は読めないため、チップで自分の面を持たせる。 */}
        <div className="mb-3 flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-md border py-1 pl-2.5 pr-[calc(0.625rem-0.28em)] text-[11px] tracking-[0.28em] backdrop-blur-sm"
            style={{
              fontFamily: MONO,
              background: 'rgba(10,21,38,0.72)',
              borderColor: 'color-mix(in srgb, var(--page-accent) 32%, transparent)',
              color: 'var(--page-accent-text)',
            }}
          >
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-[0.5px]"
              style={{
                background: 'var(--page-accent)',
                boxShadow: '0 0 6px var(--page-accent)',
              }}
            />
            {sub}
          </span>
          <span
            aria-hidden="true"
            className="h-px flex-1"
            style={{
              background: `linear-gradient(90deg, ${accent}66, transparent 70%)`,
            }}
          />
        </div>

        {/* 見出し。極太ディスプレイ体 Dela Gothic One(自己ホスト・単一ウェイトなので 400 固定。
            bold 指定は faux-bold=合成太字で字形が崩れるため使わない)。
            背景直置きなので、濃い黒影(text-hud-shadow 相当)をスクリム代わりに敷く。 */}
        <h1
          className="text-3xl text-white sm:text-4xl"
          style={{
            fontFamily: "'Dela Gothic One', var(--font-display)",
            fontWeight: 400,
            textShadow: `0 1px 3px rgba(0,0,0,0.92), 0 0 7px rgba(0,0,0,0.6), 0 0 26px ${accent}44`,
          }}
        >
          {title}
        </h1>

        {/* アクセント下線(細いネオンバー) */}
        <div
          aria-hidden="true"
          className="mt-3 h-[2px] w-24 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            boxShadow: `0 0 10px ${accent}66`,
          }}
        />

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
