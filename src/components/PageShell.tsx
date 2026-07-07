// 下層ページ共通のコンテナ。ヘッダー(タイトル + 英語サブ)とガラス調の本文枠。
// ページ遷移時に軽いフェードアップ演出を付ける(prefers-reduced-motion で無効)。
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface PageShellProps {
  title: string;
  sub: string;
  lead?: string;
  children: ReactNode;
}

export function PageShell({ title, sub, lead, children }: PageShellProps) {
  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      {/* パンくず的な戻り導線 */}
      <Link
        to="/"
        className="glass-dark mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white/85 transition-colors hover:text-white"
      >
        <span aria-hidden="true">←</span> ホームへ戻る
      </Link>

      {/* ページヘッダー */}
      <header className="mb-8 [animation:var(--animate-fade-up)]">
        <p className="text-glow mb-1 text-xs font-semibold tracking-[0.4em] text-neon-glow">
          {sub}
        </p>
        {/* 詳細ページの見出し。極太ディスプレイ体 Dela Gothic One(index.css の @font-face で
            自己ホスト)。単一ウェイト体なので font-bold は付けず fontWeight:400 で描く
            (bold 指定は faux-bold=合成太字で字形が崩れるため)。読込前/失敗時は
            var(--font-display) にフォールバック。 */}
        <h1
          className="text-glow text-3xl text-white sm:text-4xl"
          style={{
            fontFamily: "'Dela Gothic One', var(--font-display)",
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        {lead && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
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
