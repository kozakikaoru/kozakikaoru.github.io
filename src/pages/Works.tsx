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
} from '../components/HudKit';
import { SkillIcon } from '../components/SkillIcon';
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
    <PageShell title="個人開発" accent={ACCENT}>
      <div className="grid gap-6 sm:grid-cols-2">
        {WORKS.map((w, i) => (
          <WorkCard key={w.id} work={w} index={i} />
        ))}
      </div>
    </PageShell>
  );
}

/** プロダクト1件ぶんのカード。 */
function WorkCard({ work, index }: { work: Work; index: number }) {
  // OG 画像の取得に失敗したらグラデーションのフォールバックへ切り替える。
  const [imgFailed, setImgFailed] = useState(false);
  // ポップの原点を列の外側の下角に固定し、画面端へはみ出さないようにする(2 カラム時)。
  // 左列(偶数 index)は左下を固定して内側+上へ、右列は右下を固定して内側+上へ伸びる。
  // SP は 1 カラム & hover 無しなので影響しない。
  const originClass =
    index % 2 === 0 ? 'sm:origin-bottom-left' : 'sm:origin-bottom-right';

  return (
    <HudCard
      pad={false}
      clip={false}
      // ホバーの設計(ユーザーFBの積み重ね):
      //   - 「カードごと拡大」は文字・リンクまで大きくなるので不可
      //   - 「画像だけポップ」は下の要素が置いていかれるので不足
      //   → 画像はポップ + カード全体(下の情報ごと)は持ち上げ(translate)。
      //     translate は文字サイズを変えないので両立できる。
      // あわせてアクセント色のリングがふわっと灯る(HUD の起動っぽい演出)。
      // clip=false で HudCard の切り抜きを外し、角丸は画像ラッパー側で面取りする。
      className="group relative flex flex-col transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:motion-safe:hover:-translate-y-2 sm:motion-safe:hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.6)]"
    >
      {/* サムネイル。素材は 2:1(GitHub OG / 自作 WebP)だが枠は 16:9 に縦伸ばし
          (ユーザー指示)。あふれる分は object-position(既定 left)で右側を切る。
          ホバーで画像だけが 1.3 倍にポップ(下角原点なので上+内側へ伸び、自分の
          カードの文字は隠さない)。z-10 でポップ中も隣のカードの上に出る。
          SP / reduced-motion では無効。
          暗スクリムは掛けず、内側のヘアラインで額装して画像を主役にする。 */}
      <div
        className={`relative z-10 aspect-video w-full overflow-hidden rounded-t-2xl transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${originClass} sm:motion-safe:group-hover:scale-[1.3] sm:group-hover:shadow-[0_18px_50px_-10px_rgba(0,0,0,0.7)]`}
      >
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
            // 16:9 枠に 2:1 素材を cover で入れるため左右どちらかが切れる。
            // 大事な要素は左寄りに多い(OG のリポジトリ名等)ので既定は左を残す。
            style={{ objectPosition: work.imagePos ?? 'left center' }}
            className="h-full w-full object-cover"
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

        {/* 技術タグ(GitHub の実データ・公式カラーのアイコン付きチップ) */}
        <ul className="mt-3 flex flex-wrap items-center gap-1.5">
          {work.tags.map((t) => (
            <li key={t}>
              <Chip className="gap-1.5">
                <SkillIcon name={t} />
                {t}
              </Chip>
            </li>
          ))}
        </ul>

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

      {/* ホバーで灯るアクセントのリング(HUD 起動演出)。枠線+弱い発光を
          カード全面に重ね、opacity だけをふわっと遷移させる。 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 sm:group-hover:opacity-100"
        style={{
          border:
            '1px solid color-mix(in srgb, var(--page-accent) 55%, transparent)',
          boxShadow:
            '0 0 24px -4px color-mix(in srgb, var(--page-accent) 35%, transparent)',
        }}
      />
    </HudCard>
  );
}
