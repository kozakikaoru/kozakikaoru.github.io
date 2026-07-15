// プロダクト(Works)ページ。GitHub で公開している個人開発のアプリ・ツール一覧。
// カードは「公開ページ」「リポジトリ」の2リンクを内包するため、
// カード全体を <a> にはしない(リンクの入れ子は HTML として不正)。
// グリッドは 2 カラム止まり(3 カラムだとサムネイルが 309px まで縮んで主役にならない)。
import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import {
  Chip,
  HudCard,
  IconExternal,
  IconGitHub,
  MonoTag,
} from '../components/HudKit';
import { WORKS, type Work } from '../data/works';

// ページアクセント(panels.ts の works と同色)。
const ACCENT = '#ff5566';

// アイコンリンクの共通スタイル。アイコン自体は 18px だが、
// タップ領域は 44px 角(モバイルの最小タップターゲット)を確保する。
// hover は色ではなく不透明度で出す(色はインライン style で決めており、
// クラスの hover:bg-* / hover:text-* ではインライン style に勝てないため)。
const ICON_LINK_CLASS =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg transition-opacity hover:opacity-80';

export default function Works() {
  return (
    <PageShell title="開発作品" sub="WORKS" accent={ACCENT}>
      <div className="grid gap-6 sm:grid-cols-2">
        {WORKS.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>

      {/* 背景直置きの注記なので、濃い黒影をスクリム代わりに敷く。 */}
      <p className="text-hud-shadow mt-6 text-center text-xs text-white/75">
        ※ サムネイルはGitHubの自動生成画像（仮）です。実際のスクリーンショットに順次差し替え予定です。
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
      className="group flex flex-col transition-transform duration-300 hover:-translate-y-1"
    >
      {/* サムネイル(GitHub OG 画像は 1200×600 = 2:1)。
          暗スクリムは掛けず、内側のヘアラインで額装して画像を主役にする。 */}
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
            alt={`${work.title}のサムネイル`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            // motion-safe を必ず付ける。共通の reduced-motion 対応は duration を
            // 潰すだけなので、付けないと拡大だけ即座に起きてカクつく。
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
          />
        )}
        {/* 額装の内側ヘアライン(画像とカードの境目を締める) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}
        />
      </div>

      {/* 情報 */}
      <div className="flex flex-1 flex-col p-5 text-white">
        <h2 className="text-base font-bold">{work.title}</h2>
        <p className="mt-2 text-sm text-white/90">{work.summary}</p>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-white/75">
          {work.note}
        </p>

        {/* タグ(言語=MonoTag / 種別=Chip) */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <MonoTag>{work.tags[0]}</MonoTag>
          <Chip>{work.tags[1]}</Chip>
        </div>

        {/* リンク(公開ページは GitHub Pages 公開があるものだけ)。
            読み上げ名は <a> の aria-label に置く(SVG 側は aria-hidden)。 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {work.pagesUrl && (
            <a
              href={work.pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${work.title}を新しいタブで開く`}
              title={`${work.title}を新しいタブで開く`}
              className={ICON_LINK_CLASS}
              style={{
                border:
                  '1px solid color-mix(in srgb, var(--page-accent) 55%, transparent)',
                background: 'color-mix(in srgb, var(--page-accent) 14%, transparent)',
                color: 'var(--page-accent-text)',
              }}
            >
              <IconExternal />
            </a>
          )}
          <a
            href={work.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${work.title}のGitHubリポジトリを新しいタブで開く`}
            title={`${work.title}のGitHubリポジトリを新しいタブで開く`}
            className={`${ICON_LINK_CLASS} border border-white/20 bg-white/[0.06]`}
            // 文字色は className では効かない(index.css の a{color:inherit} が
            // レイヤー外にあり、@layer utilities の text-* に勝つため)。style で直接指定する。
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            <IconGitHub />
          </a>
        </div>
      </div>
    </HudCard>
  );
}
