// 制作楽曲ページ。AI 楽曲を CD プレイヤー風 UI で試聴 + 歌詞表示できる。
import { PageShell } from '../components/PageShell';
import { RecordPlayer } from '../components/music/RecordPlayer';

export default function Music() {
  return (
    <PageShell title="制作楽曲" accent="#05d9e8">
      <RecordPlayer />

      {/* 配信についての案内は一旦コメントアウト(ユーザーFB)。
          復活させる時はこの JSX を戻し、HudKit から
          HudCard / MonoTag / SectionHeading の import も戻すこと。
      <section className="mt-12">
        <SectionHeading>配信について</SectionHeading>
        <HudCard>
          <p className="text-sm leading-relaxed text-white/80">
            楽曲はこのサイトで直接試聴できます。新曲やフルバージョンは YouTube /
            SoundCloud での公開も検討中です。準備が整い次第、それぞれのリンクをここに掲載します。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <MonoTag>YOUTUBE — COMING SOON</MonoTag>
            <MonoTag>SOUNDCLOUD — COMING SOON</MonoTag>
          </div>
        </HudCard>
      </section>
      */}
    </PageShell>
  );
}
