// 404 ページ。HUD トーン(SIGNAL LOST)で世界観を保ちつつ TOP への導線を出す。
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { PageShell } from '../components/PageShell';
import { HudCard, MonoTag } from '../components/HudKit';

// ページアクセント(汎用グローの明シアン)。
const ACCENT = '#7ff3ff';

// 内部遷移は react-router の Link を使うため、NeonLink(a 要素)と同じ見た目を
// ここでローカルに再現する(HudKit を Link 対応にはしない方針)。
const NEON_LINK_CLASS =
  'mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold tracking-wide text-[#eafcff] transition-all hover:-translate-y-px';
const NEON_LINK_STYLE: CSSProperties = {
  border: '1px solid color-mix(in srgb, var(--page-accent, #7ff3ff) 60%, transparent)',
  background: 'color-mix(in srgb, var(--page-accent, #7ff3ff) 14%, transparent)',
  boxShadow: '0 0 14px color-mix(in srgb, var(--page-accent, #7ff3ff) 22%, transparent)',
};

export default function NotFound() {
  return (
    <PageShell
      title="ページが見つかりません"
      sub="404"
      lead="SIGNAL LOST — お探しのページは電波の届かない場所にあるようです。"
      accent={ACCENT}
    >
      <HudCard className="text-center text-white sm:p-8">
        <MonoTag>ERR 404 // NO SIGNAL</MonoTag>
        {/* Dela Gothic One は単一ウェイト体のため 400 固定(faux-bold 回避) */}
        <p
          className="mt-4 text-6xl text-white"
          style={{
            fontFamily: "'Dela Gothic One', var(--font-display)",
            fontWeight: 400,
            textShadow:
              '0 1px 2px rgba(0,0,0,0.45), 0 0 26px color-mix(in srgb, var(--page-accent, #7ff3ff) 45%, transparent)',
          }}
        >
          404
        </p>
        <p className="mt-4 text-white/85">
          URL をご確認いただくか、下のボタンからトップへお戻りください。
        </p>
        <Link to="/" className={NEON_LINK_CLASS} style={NEON_LINK_STYLE}>
          ホームへ戻る
        </Link>
      </HudCard>
    </PageShell>
  );
}
