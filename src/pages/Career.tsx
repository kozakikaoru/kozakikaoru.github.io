// 経歴(Career)ページ。客先に見せる想定で、案件をロードマップ/タイムライン形式に。
// 新しい順に並べ、ドメイン(案件ジャンル)で色分けする。
import { useMemo } from 'react';
import { PageShell } from '../components/PageShell';
import { TimelineItem } from '../components/TimelineItem';
import { CAREER_PROJECTS, DOMAIN_COLORS } from '../data/career';

export default function Career() {
  // 新しい順(sortKey 降順)に並べる。
  const sorted = useMemo(
    () =>
      [...CAREER_PROJECTS].sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [],
  );

  // 凡例に出すドメイン一覧(実データに登場するものだけ)。
  const domains = useMemo(
    () => Array.from(new Set(sorted.map((p) => p.domain))),
    [sorted],
  );

  return (
    <PageShell
      title="経歴"
      sub="CAREER"
      lead="これまで対応してきた案件のロードマップです。新しいものから順に、役割・取り組み・成果をまとめています。"
    >
      {/* 凡例 */}
      <div className="glass-dark mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-4 py-3 text-xs text-white/85">
        <span className="font-semibold text-white/60">案件ジャンル:</span>
        {domains.map((d) => (
          <span key={d} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                background: DOMAIN_COLORS[d] ?? DOMAIN_COLORS['デフォルト'],
              }}
              aria-hidden="true"
            />
            {d}
          </span>
        ))}
      </div>

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
