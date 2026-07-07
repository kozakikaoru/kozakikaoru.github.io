// 作品集(Works)ページ。制作物のギャラリー。
// 画像がまだ無いので、世界観に合うグラデーションのプレースホルダで見せる。
import { PageShell } from '../components/PageShell';
import { WORKS } from '../data/works';

export default function Works() {
  return (
    <PageShell
      title="作品集"
      sub="WORKS"
      lead="これまでに手がけた制作物の一部です。（サムネイルは準備中のため、仮の表示になっています）"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {WORKS.map((w) => {
          const CardTag = w.link ? 'a' : 'div';
          return (
            <CardTag
              key={w.id}
              {...(w.link
                ? {
                    href: w.link,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  }
                : {})}
              className="glass-dark group flex flex-col overflow-hidden rounded-3xl text-white transition-transform duration-300 hover:-translate-y-1"
            >
              {/* サムネイル or プレースホルダ */}
              <div className="relative aspect-video w-full overflow-hidden">
                {w.thumbnailUrl ? (
                  <img
                    src={w.thumbnailUrl}
                    alt={w.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${w.gradient[0]}, ${w.gradient[1]})`,
                    }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-white/60" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="8.5" cy="9.5" r="1.8" />
                      <path d="M4 17l5-4 4 3 3-2 4 3" />
                    </svg>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium backdrop-blur">
                  {w.category}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] tabular-nums backdrop-blur">
                  {w.year}
                </span>
              </div>

              {/* 情報 */}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-bold">{w.title}</h2>
                <p className="mt-2 flex-1 text-sm text-white/80">
                  {w.summary}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {w.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/85"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                {w.link && (
                  <span className="mt-3 text-xs text-neon-glow">
                    詳しく見る →
                  </span>
                )}
              </div>
            </CardTag>
          );
        })}
      </div>
    </PageShell>
  );
}
