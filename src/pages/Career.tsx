// 経歴(Career)ページ。客先に見せる想定で、案件をロードマップ/タイムライン形式に。
// 新しい順に並べる。
import { useMemo } from 'react';
import { PageShell } from '../components/PageShell';
import { TimelineItem } from '../components/TimelineItem';
import { CAREER_PROJECTS } from '../data/career';

// ページアクセント(panels.ts の career と同色)。
const ACCENT = '#ff9e2c';

export default function Career() {
  // 新しい順(sortKey 降順)に並べる。
  const sorted = useMemo(
    () =>
      [...CAREER_PROJECTS].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [],
  );

  return (
    <PageShell title="経歴" sub="CAREER" accent={ACCENT}>
      {/* タイムライン */}
      <ol className="relative">
        {sorted.map((p, i) => (
          <TimelineItem
            key={p.id}
            project={p}
            isLast={i === sorted.length - 1}
          />
        ))}
      </ol>

      <p className="mt-4 text-center text-xs text-white/50">
        ※ 掲載内容は一部ぼかしています。詳細はお問い合わせください。
      </p>
    </PageShell>
  );
}
