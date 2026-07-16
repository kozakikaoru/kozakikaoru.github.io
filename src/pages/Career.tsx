// 経歴(Career)ページ。客先に見せる想定で、案件と節目を1本のタイムラインに載せる。
// 新しい順に並べ、年が変わる位置に YearMarker(目盛り+年ラベル)を挟んで
// 時間軸を読みやすくする。
import { useMemo } from 'react';
import { PageShell } from '../components/PageShell';
import {
  MilestoneItem,
  TimelineItem,
  YearMarker,
} from '../components/TimelineItem';
import {
  CAREER_MILESTONES,
  CAREER_PROJECTS,
  type CareerMilestone,
  type CareerProject,
} from '../data/career';

// ページアクセント(panels.ts の career と同色)。
const ACCENT = '#ff9e2c';

// タイムラインの1エントリ(案件 / 節目 / 年区切り)。
type Entry =
  | { kind: 'year'; key: string; year: string }
  | { kind: 'project'; key: string; project: CareerProject }
  | { kind: 'milestone'; key: string; milestone: CareerMilestone };

export default function Career() {
  // 案件と節目を混ぜて新しい順に並べ、年が変わる位置に年マーカーを挟む。
  const entries = useMemo<Entry[]>(() => {
    const items = [
      ...CAREER_PROJECTS.map((p) => ({
        kind: 'project' as const,
        sortKey: p.sortKey,
        project: p,
      })),
      ...CAREER_MILESTONES.map((m) => ({
        kind: 'milestone' as const,
        sortKey: m.sortKey,
        milestone: m,
      })),
    ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

    const out: Entry[] = [];
    let year = '';
    for (const it of items) {
      const y = it.sortKey.slice(0, 4);
      if (y !== year) {
        out.push({ kind: 'year', key: `year-${y}`, year: y });
        year = y;
      }
      out.push(
        it.kind === 'project'
          ? { kind: 'project', key: it.project.id, project: it.project }
          : { kind: 'milestone', key: it.milestone.id, milestone: it.milestone },
      );
    }
    return out;
  }, []);

  return (
    <PageShell title="経歴" sub="CAREER" accent={ACCENT}>
      {/* タイムライン */}
      <ol className="relative">
        {entries.map((e, i) => {
          const isFirst = i === 0;
          const isLast = i === entries.length - 1;
          if (e.kind === 'year') {
            return (
              <YearMarker
                key={e.key}
                year={e.year}
                isFirst={isFirst}
                isLast={isLast}
              />
            );
          }
          if (e.kind === 'milestone') {
            return (
              <MilestoneItem
                key={e.key}
                milestone={e.milestone}
                isFirst={isFirst}
                isLast={isLast}
              />
            );
          }
          return (
            <TimelineItem
              key={e.key}
              project={e.project}
              isFirst={isFirst}
              isLast={isLast}
            />
          );
        })}
      </ol>

      {/* 背景直置きの注記なので、濃い黒影をスクリム代わりに敷く。 */}
      <p className="text-hud-shadow mt-4 text-center text-xs text-white/75">
        ※ 掲載内容は一部ぼかしています。詳細はお問い合わせください。
      </p>
    </PageShell>
  );
}
