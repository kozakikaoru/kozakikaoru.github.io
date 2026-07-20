// 経歴タイムラインの項目群。時系列は「下から上」(一番下が最古)。
// 1本の連続した縦線(Career.tsx の <ol> が持つ border-l)に沿って並べ、
// 年月は線上のドット付きで枠の外に出す:
//
//   ● 現在
//   │ [案件カード(バッジ・内容・技術タグはカードの中)]
//   ● 2024.07
//   │
//   ● 2021.05 個人事業主として開業   ← 節目も同じ「線外の日付」デザイン
//
// 位置の約束(Career.tsx と対):
//   <ol> は border-l-2 + pl-5(sm:pl-6)。ドットは線の中心(x=1px)に重なるよう
//   -left-[25px](sm:-29px)に置く(= border 2px + padding 20/24px から逆算)。
//   ol の padding を変えるならドットの位置も合わせて直すこと。
import type { ReactNode } from 'react';
import { type CareerMilestone, type CareerProject } from '../data/career';
import { Chip, HudCard, MONO } from './HudKit';
import { SkillIcon } from './SkillIcon';

/** 年月ラベル行。線上のドット + 日付(+ 節目のタイトル等の後続要素)。 */
function DateRow({ date, children }: { date: string; children?: ReactNode }) {
  return (
    <div className="relative flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {/* 線上のドット(連続線に打つ目印) */}
      <span
        aria-hidden="true"
        className="absolute -left-[25px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full sm:-left-[29px]"
        style={{
          background: 'color-mix(in srgb, var(--page-accent) 85%, transparent)',
          boxShadow:
            '0 0 8px color-mix(in srgb, var(--page-accent) 60%, transparent)',
        }}
      />
      <time
        className="text-hud-shadow text-[13px] tracking-[0.14em] tabular-nums"
        style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
      >
        {date}
      </time>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// 節目: 線外の日付 + タイトル(案件の年月ラベルとデザインを揃える)
// ------------------------------------------------------------------
export function MilestoneItem({ milestone }: { milestone: CareerMilestone }) {
  return (
    <li>
      <DateRow date={milestone.date}>
        {/* タイトルは小さなパネルに載せる(背景と被って読みにくいため面を持たせる)。
            日付は案件と同じく枠の外・線の上。 */}
        <span
          className="inline-flex h-8 items-center rounded-lg border border-white/12 px-3 text-[13px] text-white/90 backdrop-blur-sm"
          style={{ background: 'rgba(10,21,38,0.72)' }}
        >
          {milestone.title}
        </span>
      </DateRow>
    </li>
  );
}

// ------------------------------------------------------------------
// 案件: 終了年月(上)→ 内容カード → 開始年月(下)
// ------------------------------------------------------------------
export function TimelineItem({ project }: { project: CareerProject }) {
  const ongoing = project.status === 'ongoing';

  return (
    <li>
      {/* 終了年月(進行中は「現在」)。バッジはカードの中へ(ユーザー指示) */}
      <DateRow date={project.end} />

      <HudCard pad={false} className="my-2.5 p-5 sm:p-6">
        {/* 案件タイトル + 状態バッジ。
            タイトルは Dela Gothic One 不可(サブセットに案件名の字が無い)。 */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="text-[18px] font-bold leading-[1.45] tracking-[0.01em] text-white sm:text-[20px]">
            {project.title}
          </h2>
          {ongoing && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] tracking-[0.08em] text-emerald-300"
              style={{ fontFamily: MONO }}
            >
              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-emerald-300"
              />
              進行中
            </span>
          )}
          {project.startup && (
            <span className="inline-flex items-center rounded-full border border-white/18 px-2 py-0.5 text-[10px] text-white/75">
              スタートアップ
            </span>
          )}
        </div>

        {/* 案件概要(設定時のみ表示) */}
        {project.summary && (
          <p className="mt-3 text-sm leading-[1.75] text-white/75">
            {project.summary}
          </p>
        )}

        {/* やったこと */}
        <ul className="mt-4 space-y-1.5 text-sm leading-[1.75] text-white/90">
          {project.highlights.map((h) => (
            <li key={h} className="relative pl-4">
              {/* 行頭記号は CSS の矩形で描く(和文フォントに ▹ が無く崩れるため) */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.62em] h-[3px] w-[3px] rounded-[0.5px]"
                style={{
                  background:
                    'color-mix(in srgb, var(--page-accent) 80%, transparent)',
                }}
              />
              {h}
            </li>
          ))}
        </ul>

        {/* 成果(設定時のみ表示) */}
        {project.outcome && (
          <p className="mt-4 rounded-xl bg-white/[0.06] px-3 py-2 text-sm leading-[1.75] text-white/90">
            <span
              className="mr-1 font-bold"
              style={{ color: 'var(--page-accent-text)' }}
            >
              成果:
            </span>
            {project.outcome}
          </p>
        )}

        {/* 技術タグ(プロフィールのスキルと同じ、公式カラーのアイコン付きチップ) */}
        <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.08] pt-4">
          {project.stack.map((s) => (
            <li key={s}>
              <Chip className="gap-1.5">
                <SkillIcon name={s} />
                {s}
              </Chip>
            </li>
          ))}
        </ul>
      </HudCard>

      {/* 開始年月(時系列は下→上なので、始まりが下に来る) */}
      <DateRow date={project.start} />
    </li>
  );
}
