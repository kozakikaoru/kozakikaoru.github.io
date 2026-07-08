// プロダクト(Works)ページ。GitHub で公開している個人開発のアプリ・ツール一覧。
// カードは「LIVE(GitHub Pages)」「GITHUB(リポジトリ)」の2リンクを内包するため、
// カード全体を <a> にはしない(リンクの入れ子は HTML として不正)。
import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Chip, HudCard, MonoTag, NeonLink } from '../components/HudKit';
import { WORKS, type Work } from '../data/works';

// ページアクセント(panels.ts の works と同色)。
const ACCENT = '#ff5566';

export default function Works() {
  return (
    <PageShell
      title="プロダクト"
      sub="PRODUCTS"
      lead="個人開発のアプリやツールたち。GitHub で公開しているものを載せています。（スクリーンショットは準備中のため、GitHub の自動生成画像を仮置きしています）"
      accent={ACCENT}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {WORKS.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-white/50">
        ※ サムネイルは GitHub の自動生成画像（仮）です。実際のスクリーンショットに順次差し替え予定です。
      </p>
    </PageShell>
  );
}

/** プロダクト1件ぶんのカード。 */
function WorkCard({ work }: { work: Work }) {
  // OG 画像の取得に失敗したらグラデーションのフォールバックへ切り替える。
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <HudCard
      pad={false}
      className="flex flex-col transition-transform duration-300 hover:-translate-y-1"
    >
      {/* サムネイル(GitHub OG 画像は 1200×600 = 2:1) */}
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        {imgFailed ? (
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--page-accent) 40%, #0a1526), #0a1526)',
            }}
            aria-hidden="true"
          />
        ) : (
          <img
            src={work.imageUrl}
            alt={`${work.title} のサムネイル`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
        {/* 白ベースの OG 画像が眩しくならないよう、下から薄い暗スクリムを掛ける */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1526]/70 via-transparent"
        />
      </div>

      {/* 情報 */}
      <div className="flex flex-1 flex-col p-5 text-white">
        <h2 className="text-base font-bold">{work.title}</h2>
        <p className="mt-2 text-sm text-white/85">{work.summary}</p>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-white/60">
          {work.note}
        </p>

        {/* タグ(言語=MonoTag / 種別=Chip) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MonoTag>{work.tags[0]}</MonoTag>
          <Chip>{work.tags[1]}</Chip>
        </div>

        {/* リンク(LIVE は GitHub Pages 公開があるものだけ) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {work.pagesUrl && (
            <NeonLink
              href={work.pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              LIVE ↗
            </NeonLink>
          )}
          <NeonLink
            subtle
            href={work.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GITHUB ↗
          </NeonLink>
        </div>
      </div>
    </HudCard>
  );
}
