// 経歴(Career)ページ。客先に見せる想定で、案件と節目を1本のタイムラインに載せる。
// 新しい順(上=最新)に並べる。時系列は下から上へ流れ、各案件が自分の
// 開始年月(下)と終了年月(上)を持つ(年マーカーはユーザー指示で廃止)。
import { useMemo } from 'react';
import { PageShell } from '../components/PageShell';
import {
  MilestoneItem,
  SchoolItem,
  TimelineItem,
} from '../components/TimelineItem';
import {
  CAREER_MILESTONES,
  CAREER_PROJECTS,
  CAREER_SCHOOLS,
  type CareerMilestone,
  type CareerProject,
  type CareerSchool,
} from '../data/career';

// ページアクセント(panels.ts の career と同色)。
const ACCENT = '#ff9e2c';

// タイムラインの1エントリ(案件 / 節目 / 学校)。
type Entry =
  | { kind: 'project'; key: string; project: CareerProject }
  | { kind: 'milestone'; key: string; milestone: CareerMilestone }
  | { kind: 'school'; key: string; school: CareerSchool };

/** 'YYYY.MM' を通し月数に。'現在' 等の非日付は null。 */
function ym(s: string): number | null {
  const m = s.match(/^(\d{4})\.(\d{2})$/);
  return m ? Number(m[1]) * 12 + Number(m[2]) : null;
}
/** 2つの年月の差(月)。どちらかが非日付なら null。 */
function monthGap(a: string, b: string): number | null {
  const x = ym(a);
  const y = ym(b);
  return x == null || y == null ? null : Math.abs(x - y);
}
/** その項目の下側に出る年月(案件/学校=開始、節目=日付)。 */
function bottomDate(e: Entry): string {
  return e.kind === 'project'
    ? e.project.start
    : e.kind === 'school'
      ? e.school.start
      : e.milestone.date;
}
/** その項目の上側に出る終了年月(案件/学校のみ・節目は無し)。 */
function endDate(e: Entry): string | null {
  return e.kind === 'project'
    ? e.project.end
    : e.kind === 'school'
      ? e.school.end
      : null;
}

export default function Career() {
  // 案件・節目・学校を混ぜて新しい順に並べる。
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
        ...CAREER_SCHOOLS.map((s) => ({
          kind: 'school' as const,
          key: s.id,
          sortKey: s.sortKey,
          school: s,
        })),
      ].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [],
  );

  // 年月ラベルの間引き: 直前の項目の下端(開始/日付)と、この項目の終了年月が
  // 1ヶ月以内なら、この項目の「終了」ラベルを隠して上側の1つにまとめる
  //   (例: 専門入学2014.04 の直下の 高校卒業2014.03 は隠して4月だけに /
  //    退社2021.04 と重なる 自動車フリマ終了2021.04 も1つに)。
  //   2ヶ月以上空いていれば両方残す(例: 入社2016.04 と レシート開始2016.09)。
  const hideEnd = useMemo<boolean[]>(
    () =>
      entries.map((e, i) => {
        if (i === 0) return false;
        const end = endDate(e);
        if (end == null) return false;
        const gap = monthGap(bottomDate(entries[i - 1]), end);
        return gap != null && gap <= 1;
      }),
    [entries],
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
        {entries.map((e, i) => {
          if (e.kind === 'milestone') {
            return <MilestoneItem key={e.key} milestone={e.milestone} />;
          }
          if (e.kind === 'school') {
            return (
              <SchoolItem key={e.key} school={e.school} hideEnd={hideEnd[i]} />
            );
          }
          return (
            <TimelineItem key={e.key} project={e.project} hideEnd={hideEnd[i]} />
          );
        })}
      </ol>
    </PageShell>
  );
}
