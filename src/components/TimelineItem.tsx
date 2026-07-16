// 経歴タイムラインの項目群。左に計器レール(縦の時間軸)、右に内容。
// 3種類の <li> を提供する:
//   - TimelineItem:  案件カード(詳細あり)
//   - MilestoneItem: 節目(卒業・入社・独立など)。タイトルだけの1行チップで、
//                    案件カードとは意図的に見た目の重さを変えている
//   - YearMarker:    年の区切り。レールに目盛りを打ち、年ラベル+ヘアラインを出す
//
// レールの連続性(重要・ユーザーFB「途切れ途切れで気持ち悪い」対応):
//   各 li のレールを「自分のノード→次のノード」で描くと、項目ごとに --node-y が
//   違うため継ぎ目がズレて途切れて見えた。→ 各 li のレールを「li の箱全体」を
//   縦断する形にして隣接させ、全体で 1 本の連続した直線に見せる:
//     - 中間: top:0 〜 (100% + --rail-gap)   … li 全高。次 li の top:0 と接する
//     - 先頭: top:--node-y から             … 最初のノード(目盛り)から始める
//     - 末尾: top:0 〜 --node-y              … 最後のノードで止める
//   grid の align は既定 stretch なので左列(100%)= 右列コンテンツ高 = li の content。
//   それに --rail-gap(= li の pb と必ず同値)を足すと li 全高になり、隙間なく連なる。
//   レールは単色(グラデ廃止=ユーザーFB)。
//
// レイアウトの要点:
//   - ノード・レールは left-1/2 の同一アンカー(x ズレが構造的に起きない)。
//   - --node-y は「li 上端 → その項目のノード中心」。行の高さを固定(h-8 等)して
//     データ差(バッジ有無など)で中心がズレないようにする。
import type { ReactNode } from 'react';
import { type CareerMilestone, type CareerProject } from '../data/career';
import { HudCard, MONO } from './HudKit';

const RAIL_COLOR = 'color-mix(in srgb, var(--page-accent) 42%, transparent)';

/** レール(縦軸)+ 接続トレース + ノードの共通コンテナ(左列)。 */
function RailColumn({
  isFirst,
  isLast,
  trace,
  node,
}: {
  isFirst: boolean;
  isLast: boolean;
  /** ノードからカード/チップ左辺への横線を引くか(年マーカーは引かない)。 */
  trace: boolean;
  node: ReactNode;
}) {
  // 連続レールの縦範囲(上のコメント参照)。
  const railTop = isFirst ? 'var(--node-y)' : '0';
  const railHeight = isLast
    ? isFirst
      ? '0'
      : 'var(--node-y)'
    : isFirst
      ? 'calc(100% + var(--rail-gap) - var(--node-y))'
      : 'calc(100% + var(--rail-gap))';

  return (
    <div className="relative">
      {/* 縦レール(単色・連続) */}
      {!(isFirst && isLast) && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 w-[2px] -translate-x-1/2"
          style={{ top: railTop, height: railHeight, background: RAIL_COLOR }}
        />
      )}

      {/* ノード→内容への接続トレース(単色)。列の中心から内容の左辺まで。
          右端の -right-2 / sm:-right-3 は grid の gap-x-2 / sm:gap-x-3 と対で、
          gap を変えるならここも合わせること。 */}
      {trace && (
        <span
          aria-hidden="true"
          className="absolute -right-2 left-1/2 top-[var(--node-y)] h-px -translate-y-1/2 sm:-right-3"
          style={{
            background: 'color-mix(in srgb, var(--page-accent) 28%, transparent)',
          }}
        />
      )}

      {node}
    </div>
  );
}

// ------------------------------------------------------------------
// 年マーカー: レールに目盛り + 年ラベル。時間軸を読みやすくする区切り。
// ------------------------------------------------------------------
export function YearMarker({
  year,
  isFirst,
  isLast,
}: {
  year: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative grid grid-cols-[36px_1fr] gap-x-2 pb-3 [--node-y:11px] [--rail-gap:12px] sm:grid-cols-[44px_1fr] sm:gap-x-3">
      <RailColumn
        isFirst={isFirst}
        isLast={isLast}
        trace={false}
        node={
          // 目盛り(定規の刻み)。レールを横切る短い水平線
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[var(--node-y)] h-[2px] w-3 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'color-mix(in srgb, var(--page-accent) 80%, transparent)',
            }}
          />
        }
      />
      {/* 行高を h-[22px] に固定(--node-y:11px の前提)。 */}
      <div className="flex h-[22px] items-center gap-3">
        <span
          className="text-hud-shadow text-sm font-bold tracking-[0.22em] text-white/85"
          style={{ fontFamily: MONO }}
        >
          {year}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
      </div>
    </li>
  );
}

// ------------------------------------------------------------------
// 節目: タイトルだけの1行チップ(卒業・入社・独立など)。詳細は持たない。
// ------------------------------------------------------------------
export function MilestoneItem({
  milestone,
  isFirst,
  isLast,
}: {
  milestone: CareerMilestone;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="relative grid grid-cols-[36px_1fr] gap-x-2 pb-5 [--node-y:16px] [--rail-gap:20px] sm:grid-cols-[44px_1fr] sm:gap-x-3">
      <RailColumn
        isFirst={isFirst}
        isLast={isLast}
        trace
        node={
          // 小さめのダイヤ(案件ノードの縮小版・発光なし)。格の違いを出す
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[var(--node-y)] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              background: '#0a1526',
              border:
                '1px solid color-mix(in srgb, var(--page-accent) 55%, transparent)',
            }}
          />
        }
      />
      {/* チップ高を h-8(32px)に固定(--node-y:16px の前提)。 */}
      <div>
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
      </div>
    </li>
  );
}

// ------------------------------------------------------------------
// 案件カード
// ------------------------------------------------------------------
interface TimelineItemProps {
  project: CareerProject;
  isFirst: boolean;
  isLast: boolean;
}

export function TimelineItem({ project, isFirst, isLast }: TimelineItemProps) {
  const ongoing = project.status === 'ongoing';

  return (
    <li className="relative grid grid-cols-[36px_1fr] gap-x-2 pb-6 [--node-y:31.5px] [--rail-gap:24px] sm:grid-cols-[44px_1fr] sm:gap-x-3 sm:pb-7 sm:[--node-y:35.5px] sm:[--rail-gap:28px]">
      <RailColumn
        isFirst={isFirst}
        isLast={isLast}
        trace
        node={
          // ダイヤ型ノード(HUD のウェイポイント)。進行中だけ発光を強める
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[var(--node-y)] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              background: '#0a1526',
              border: `1.5px solid ${
                ongoing
                  ? 'var(--page-accent)'
                  : 'color-mix(in srgb, var(--page-accent) 48%, transparent)'
              }`,
              boxShadow: ongoing
                ? '0 0 12px color-mix(in srgb, var(--page-accent) 60%, transparent)'
                : 'none',
            }}
          >
            <span
              className="absolute inset-[3px]"
              style={{
                background: ongoing
                  ? 'var(--page-accent)'
                  : 'color-mix(in srgb, var(--page-accent) 42%, transparent)',
              }}
            />
          </span>
        }
      />

      {/* 案件カード。余白を className で持つので pad={false}(HudCard の既定 p-6 と衝突させない)。 */}
      <HudCard pad={false} className="p-5 sm:p-6">
        {/* 期間 + 状態バッジ。高さは --node-y の前提なので固定する(上のコメント参照)。 */}
        <div className="flex h-[21px] items-center gap-2">
          <time
            className="text-[11px] tracking-[0.14em] tabular-nums"
            style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
          >
            {project.period}
          </time>
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

        {/* 案件タイトル。Dela Gothic One はサブセットに案件名の字が無いので使わない。 */}
        <h2 className="mt-1.5 text-[18px] font-bold leading-[1.45] tracking-[0.01em] text-white sm:text-[20px]">
          {project.title}
        </h2>

        {/* 案件概要(設定時のみ表示) */}
        {project.summary && (
          <p className="mt-3 text-sm leading-[1.75] text-white/75">{project.summary}</p>
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
                  background: 'color-mix(in srgb, var(--page-accent) 80%, transparent)',
                }}
              />
              {h}
            </li>
          ))}
        </ul>

        {/* 成果(設定時のみ表示) */}
        {project.outcome && (
          <p className="mt-4 rounded-xl bg-white/[0.06] px-3 py-2 text-sm leading-[1.75] text-white/90">
            <span className="mr-1 font-bold" style={{ color: 'var(--page-accent-text)' }}>
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
    </li>
  );
}
