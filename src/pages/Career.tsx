// 経歴(Career)ページ。客先に見せる想定で、案件と節目を1本のタイムラインに載せる。
// 新しい順(上=最新)に並べる。時系列は下から上へ流れ、各案件が自分の
// 開始年月(下)と終了年月(上)を持つ(年マーカーはユーザー指示で廃止)。
import { useMemo } from 'react';
import { PageShell } from '../components/PageShell';
import { MilestoneItem, TimelineItem } from '../components/TimelineItem';
import {
  CAREER_MILESTONES,
  CAREER_PROJECTS,
  type CareerMilestone,
  type CareerProject,
} from '../data/career';

// ページアクセント(panels.ts の career と同色)。
const ACCENT = '#ff9e2c';

// タイムラインの1エントリ(案件 / 節目)。
type Entry =
  | { kind: 'project'; key: string; project: CareerProject }
  | { kind: 'milestone'; key: string; milestone: CareerMilestone };

export default function Career() {
  // 案件と節目を混ぜて新しい順に並べる。
  const entries = useMemo<Entry[]>(
    () =>
      [
        ...CAREER_PROJECTS.map((p) => ({
          kind: 'project' as const,
          key: p.id,
          sortKey: p.sortKey,
          project: p,
        })),
        ...CAREER_MILESTONES.map((m) => ({
          kind: 'milestone' as const,
          key: m.id,
          sortKey: m.sortKey,
          milestone: m,
        })),
      ].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [],
  );

  return (
    <PageShell title="経歴" accent={ACCENT}>
      {/* タイムライン。1本の連続した縦線(border-l)を全項目が共有する。
          pl の値は TimelineItem のドット位置(-left-[25px]/sm:-29px)と対。 */}
      <ol
        className="ml-1 space-y-6 border-l-2 pl-5 sm:space-y-7 sm:pl-6"
        style={{
          borderColor: 'color-mix(in srgb, var(--page-accent) 42%, transparent)',
        }}
      >
        {entries.map((e) =>
          e.kind === 'milestone' ? (
            <MilestoneItem key={e.key} milestone={e.milestone} />
          ) : (
            <TimelineItem key={e.key} project={e.project} />
          ),
        )}
      </ol>
    </PageShell>
  );
}
