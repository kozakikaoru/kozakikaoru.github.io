// 経歴タイムラインの1項目。縦ラインの左にノード、右に案件カード。
import { DOMAIN_COLORS, type CareerProject } from '../data/career';

interface TimelineItemProps {
  project: CareerProject;
  isLast: boolean;
}

export function TimelineItem({ project, isLast }: TimelineItemProps) {
  const color = DOMAIN_COLORS[project.domain] ?? DOMAIN_COLORS['デフォルト'];
  const ongoing = project.status === 'ongoing';

  return (
    <li className="relative pl-12 sm:pl-16">
      {/* 縦の接続ライン(最後の項目では下に伸ばさない) */}
      {!isLast && (
        <span
          className="absolute left-[18px] top-6 h-full w-px sm:left-[26px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(165,243,252,0.6), rgba(165,243,252,0.1))',
          }}
          aria-hidden="true"
        />
      )}

      {/* ノード(丸) */}
      <span
        className="absolute left-2 top-4 flex h-6 w-6 items-center justify-center rounded-full sm:left-[10px]"
        style={{
          background: color,
          boxShadow: `0 0 16px ${color}`,
        }}
        aria-hidden="true"
      >
        {ongoing && (
          <span
            className="h-6 w-6 animate-ping rounded-full"
            style={{ background: color, opacity: 0.5 }}
          />
        )}
      </span>

      {/* カード */}
      <article className="glass-dark mb-6 rounded-3xl p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <time className="font-mono text-xs text-neon-glow">
            {project.period}
          </time>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: `${color}33`, color: '#fff' }}
          >
            {project.domain}
          </span>
          {ongoing && (
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              進行中
            </span>
          )}
        </div>

        <h2 className="mt-2 text-lg font-bold">{project.title}</h2>
        <p className="text-xs text-white/60">{project.role}</p>

        <p className="mt-3 text-sm text-white/85">{project.summary}</p>

        {/* やったこと */}
        <ul className="mt-3 space-y-1 text-sm text-white/90">
          {project.highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span aria-hidden="true" style={{ color }}>
                ▹
              </span>
              {h}
            </li>
          ))}
        </ul>

        {/* 成果 */}
        <p className="mt-3 rounded-2xl bg-white/5 px-3 py-2 text-sm">
          <span className="mr-1 font-semibold text-neon-glow">成果:</span>
          {project.outcome}
        </p>

        {/* 技術タグ */}
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <li
              key={s}
              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/85"
            >
              {s}
            </li>
          ))}
        </ul>
      </article>
    </li>
  );
}
