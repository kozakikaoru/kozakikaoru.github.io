// ミュージックページ。AI 楽曲をレコードプレイヤー風 UI で試聴できるようにする。
// 音源ファイルは準備中のため、いまは仮メタデータ + COMING SOON 表示
// (src/data/tracks.ts の src にパスを足すだけで再生できる構造)。
import { PageShell } from '../components/PageShell';
import { HudCard, MonoTag, SectionHeading } from '../components/HudKit';
import { RecordPlayer } from '../components/music/RecordPlayer';

export default function Music() {
  return (
    <PageShell
      title="ミュージック"
      sub="MUSIC"
      accent="#05d9e8"
      lead="AIと一緒につくった楽曲を試聴できるページです。曲を選ぶと歌詞も一緒に読めます。"
    >
      <RecordPlayer />

      {/* 配信予定の案内 */}
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
    </PageShell>
  );
}
