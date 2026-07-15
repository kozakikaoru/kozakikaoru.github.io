// 経歴タイムラインの1項目。左に計器ノード + 接続レール、右に案件カード。
//
// レイアウトの要点(触る前に読むこと):
//   - ノードとレールは同じ列の left-1/2 に置き、どちらも -translate-x-1/2 で中央に寄せる。
//     以前は両者の x を別々の実数(left-[26px] / left-[10px]+w-6)で置いていたため
//     sm で 4px ズレていた。同一アンカーに乗せてズレを構造的に起こせなくしている。
//   - 縦位置は --node-y(カード上端からノード中心=期間行の中心まで)で一元管理。
//     = カードの枠線(1px)+ 上余白(p-5=20 / sm:p-6=24)+ 期間行の高さ(21px)の半分。
//     カードの上余白か期間行の高さを変えたら、この値も直すこと。
//   - 期間行は h-[21px] で高さを固定してある。バッジ(21px)は期間テキスト(約16.5px)より
//     背が高いため、固定しないと「バッジの有無」で行の中心=ノードのY位置が 2.25px ズレる
//     (= データ次第でズレるので、案件にバッジを足しただけで崩れる)。
//   - レールの伸ばし量 --rail-gap は li の下余白(pb-6 / sm:pb-7)と必ず同じ値にする。
//     レールは「自分のノード中心 → 次のノード中心」を繋ぐので、
//     高さ = 列の高さ + カード間の隙間 = 100% + --rail-gap になる。
import { type CareerProject } from '../data/career';
import { HudCard, MONO } from './HudKit';

interface TimelineItemProps {
  project: CareerProject;
  isLast: boolean;
}

export function TimelineItem({ project, isLast }: TimelineItemProps) {
  const ongoing = project.status === 'ongoing';

  return (
    <li className="relative grid grid-cols-[36px_1fr] gap-x-2 pb-6 [--node-y:31.5px] [--rail-gap:24px] sm:grid-cols-[44px_1fr] sm:gap-x-3 sm:pb-7 sm:[--node-y:35.5px] sm:[--rail-gap:28px]">
      {/* 計器ノード + 接続レール */}
      <div className="relative">
        {/* 接続レール(最後の項目では下に伸ばさない)。
            ノードの下に潜り込むが、ノードは不透明な地色を持つので隠れる。 */}
        {!isLast && (
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[var(--node-y)] h-[calc(100%+var(--rail-gap))] w-px -translate-x-1/2"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--page-accent) 55%, transparent), color-mix(in srgb, var(--page-accent) 8%, transparent))',
            }}
          />
        )}

        {/* ノード(進行中だけ枠を強め + 発光。他は控えめ) */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[var(--node-y)] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: '#0a1526',
            border: `1.5px solid ${
              ongoing
                ? 'var(--page-accent)'
                : 'color-mix(in srgb, var(--page-accent) 42%, transparent)'
            }`,
            boxShadow: ongoing
              ? '0 0 10px color-mix(in srgb, var(--page-accent) 55%, transparent)'
              : 'none',
          }}
        >
          <span
            className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: ongoing
                ? 'var(--page-accent)'
                : 'color-mix(in srgb, var(--page-accent) 48%, transparent)',
            }}
          />
        </span>
      </div>

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
