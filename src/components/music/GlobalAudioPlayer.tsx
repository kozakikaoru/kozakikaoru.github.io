// 全ページ横断で継続再生するためのオーディオ本体。App 直下に常設し、
// ルート遷移で unmount されない位置に置く(= ページを移動しても音が途切れない)。
// <audio> はサイト全体でここ 1 個だけ。再生状態・曲・シーク位置は zustand
// (useAppStore)が保持し、この非表示コンポーネントがそれを購読して <audio> を
// 命令的に駆動する。Music ページの UI はストアを読み書きするだけで <audio> は持たない。
import { useEffect, useRef } from 'react';
import { TRACKS } from '../../data/tracks';
import { useAppStore } from '../../store/useAppStore';

export function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIndex = useAppStore((s) => s.trackIndex);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const seekToken = useAppStore((s) => s.seekToken);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);
  const setDuration = useAppStore((s) => s.setDuration);
  const nextTrack = useAppStore((s) => s.nextTrack);

  const track = TRACKS[trackIndex];

  // 再生/一時停止・曲切替の同期。
  //   - src 変更後に play() すれば新しい曲が頭から鳴る(trackIndex も依存に含める)。
  //   - 一時停止からの再開は <audio> が位置を保持しているので「続きから」鳴る。
  //   - play() の失敗(自動再生制限など)は catch して停止状態へ戻す。
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  }, [isPlaying, trackIndex, setPlaying]);

  // シーク要求(seekToken の変化)を <audio> の再生位置へ反映する。
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.currentTime = useAppStore.getState().currentTime;
    // seekTime は seekToken と同時に更新されるので、依存は seekToken のみでよい。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekToken]);

  return (
    <audio
      ref={audioRef}
      src={track.src}
      preload="none"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={() => nextTrack(true)}
    />
  );
}
