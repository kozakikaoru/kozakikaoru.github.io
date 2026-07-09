// 下層ページ共通のコンテナ(HUD ライト版)。
// TOP の 3D HUD の世界観を「匂わせる」程度に抑え、読みやすさを最優先する:
//   - ヘッダー: モノスペースのセクションタグ(// SUB)+ ヘアライン + Dela 見出し + アクセント下線
//   - ページごとのアクセント色(パネル accent と揃える)を --page-accent で配下へ配る
//   - 本文カード等は HudKit(HudCard 等)を使う。ライト系ガラス(旧パステル)は使わない
// ページ遷移時に軽いフェードアップ演出(prefers-reduced-motion で無効)。
import type { CSSProperties, ReactNode } from 'react';
import { MONO } from './HudKit';

interface PageShellProps {
  title: string;
  /** 英語セクション名(タグ表示 "// SUB" に使う)。 */
  sub: string;
  lead?: string;
  /**
   * ページのアクセント色(パネル accent と揃える)。
   * 未指定は汎用グロー(#7ff3ff)。配下には --page-accent としても配る。
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
      style={{ '--page-accent': accent } as CSSProperties}
    >
      {/* ページヘッダー(ホームへはヘッダーのサイト名リンクから戻れるため、
          ページ内の「HOME」戻りチップはユーザーFBで撤去) */}
      <header className="mb-10 [animation:var(--animate-fade-up)]">
        {/* セクションタグ + ヘアライン(HUD の計器ラベル風) */}
        <div className="mb-3 flex items-center gap-3">
          <p
            className="text-[11px] font-semibold tracking-[0.4em]"
            style={{ fontFamily: MONO, color: accent }}
          >
            {'// '}
            {sub}
          </p>
          <span
            aria-hidden="true"
            className="h-px flex-1"
            style={{
              background: `linear-gradient(90deg, ${accent}66, transparent 70%)`,
            }}
          />
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-[1px]"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
        </div>

        {/* 見出し。極太ディスプレイ体 Dela Gothic One(自己ホスト・単一ウェイトなので 400 固定。
            bold 指定は faux-bold=合成太字で字形が崩れるため使わない)。 */}
        <h1
          className="text-3xl text-white sm:text-4xl"
          style={{
            fontFamily: "'Dela Gothic One', var(--font-display)",
            fontWeight: 400,
            textShadow: `0 1px 2px rgba(0,0,0,0.45), 0 0 26px ${accent}44`,
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

        {lead && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
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
