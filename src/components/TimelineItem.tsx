// 経歴タイムラインの項目群。時系列は「下から上」(一番下が最古)。
// 2種類の <li> を提供する:
//   - TimelineItem:  案件。上に終了年月(+状態バッジ)、下に開始年月を置き、
//                    その間を縦の接続線で繋いで、線の右に内容カードを載せる。
//                    (ユーザーのスケッチ:
//                       2017.05 スタートアップ
//                        | タイトル
//                        | やったこと…
//                        | 技術タグ
//                       2016.09                )
//   - MilestoneItem: 節目(卒業・入社・独立など)。日付+タイトルの1行チップ。
// 旧: 左レール列(ダイヤノード)と年マーカーは撤廃(時系列が下→上なので
// 「年の区切りを上に置く」形が合わず、ユーザー指示で廃止)。
import { type CareerMilestone, type CareerProject } from '../data/career';
import { HudCard, MONO } from './HudKit';

/** 年月ラベル(背景直置きなので濃い黒影を添える)。 */
function DateLabel({ children }: { children: string }) {
  return (
    <time
      className="text-hud-shadow text-[13px] tracking-[0.14em] tabular-nums"
      style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
    >
      {children}
    </time>
  );
}

// ------------------------------------------------------------------
// 節目: 日付 + タイトルの1行チップ(詳細なし)
// ------------------------------------------------------------------
export function MilestoneItem({ milestone }: { milestone: CareerMilestone }) {
  return (
    <li>
      <span
        className="inline-flex h-8 items-center gap-2.5 rounded-lg border border-white/12 px-3 backdrop-blur-sm"
        style={{ background: 'rgba(10,21,38,0.72)' }}
      >
        <time
          className="text-[11px] tracking-[0.14em] tabular-nums"
          style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
        >
          {milestone.date}
        </time>
        <span className="text-[13px] text-white/90">{milestone.title}</span>
      </span>
    </li>
  );
}

// ------------------------------------------------------------------
// 案件: 終了年月(上)→ 接続線 + 内容カード → 開始年月(下)
// ------------------------------------------------------------------
export function TimelineItem({ project }: { project: CareerProject }) {
  const ongoing = project.status === 'ongoing';

  return (
    <li>
      {/* 終了年月(進行中は「現在」)+ 状態バッジ */}
      <div className="flex items-center gap-2">
        <DateLabel>{project.end}</DateLabel>
        {ongoing && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 px-2 py-0.5 text-[10px] tracking-[0.08em] text-emerald-300"
            style={{ fontFamily: MONO }}
          >
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-emerald-300" />
            進行中
          </span>
        )}
        {project.startup && (
          <span className="inline-flex items-center rounded-full border border-white/18 px-2 py-0.5 text-[10px] text-white/75">
            スタートアップ
          </span>
        )}
      </div>

      {/* 接続線(終了年月と開始年月を繋ぐ)。内容カードは線の右側に載せる */}
      <div
        className="my-2 ml-[7px] border-l-2 py-1 pl-3 sm:pl-4"
        style={{
          borderColor: 'color-mix(in srgb, var(--page-accent) 42%, transparent)',
        }}
      >
        <HudCard pad={false} className="p-5 sm:p-6">
          {/* 案件タイトル。Dela Gothic One はサブセットに案件名の字が無いので使わない。 */}
          <h2 className="text-[18px] font-bold leading-[1.45] tracking-[0.01em] text-white sm:text-[20px]">
            {project.title}
          </h2>

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

          {/* 技術タグ */}
          <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-white/[0.08] pt-4">
            {project.stack.map((s) => (
              <li
                key={s}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/85"
              >
                {s}
              </li>
            ))}
          </ul>
        </HudCard>
      </div>

      {/* 開始年月(時系列は下→上なので、始まりが下に来る) */}
      <div>
        <DateLabel>{project.start}</DateLabel>
      </div>
    </li>
  );
}
