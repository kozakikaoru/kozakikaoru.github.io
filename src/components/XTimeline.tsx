// X(旧Twitter)の最新投稿を、X 公式の埋め込みウィジェットで表示する。
// 静的サイト(GitHub Pages)で動く唯一の無料手段: X の widgets.js を読み込み、
// data-tweet-limit 件だけ表示する。サーバー不要・API キー不要。
//
// ★制約(ユーザーに説明済み):
//   - 見た目は X 側の箱(iframe)。テーマ(dark)と件数・chrome くらいしか調整不可。
//   - 未ログインの埋め込みは X 側の仕様で表示が不安定になることがある
//     (「投稿を表示できません」等)。読み込み失敗してもページは壊さない。
//   - 対象アカウントが公開(非鍵)である必要がある。
import { useEffect, useRef } from 'react';

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js';

declare global {
  interface Window {
    twttr?: { widgets?: { load?: (el?: HTMLElement) => void } };
  }
}

/** widgets.js を一度だけ読み込む(既に有れば即解決)。失敗しても resolve してページを壊さない。 */
function ensureWidgetsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.twttr?.widgets) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGETS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      if (window.twttr?.widgets) resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = WIDGETS_SRC;
    s.async = true;
    s.addEventListener('load', () => resolve(), { once: true });
    s.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export function XTimeline({
  handle,
  limit = 3,
}: {
  handle: string;
  limit?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    ensureWidgetsScript().then(() => {
      if (!cancelled) window.twttr?.widgets?.load?.(ref.current ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  return (
    <div ref={ref}>
      <a
        className="twitter-timeline"
        data-theme="dark"
        data-tweet-limit={limit}
        data-chrome="noheader nofooter noborders transparent"
        data-dnt="true"
        href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}
      >
        {/* ウィジェット読み込み前・失敗時のフォールバック表示 */}
        <span className="text-sm text-white/70">
          @{handle} の投稿を読み込み中…
        </span>
      </a>
    </div>
  );
}
