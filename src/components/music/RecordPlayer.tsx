// CD 風の試聴プレイヤー(PC は 1 画面に収まる 2 カラム構成)。
//   - 左: CD 盤(再生中のみ回転・盤面はキャラアート画像)+ その下にシークバーと操作ボタン
//   - 右: 曲リスト(スクロール)。各行 = 最小化アイコン + 曲名 + 再生時間(音源なしは SOON)
//   - 下: 選択中の曲の歌詞(空行でブロック分割・表示/隠すトグル)
// 音源(Track.src)が無い曲は再生系 UI を無効化する。<audio> は 1 個・曲切替は src 差し替え。
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  HudCard,
  MONO,
  MonoTag,
  NeonButton,
  NeonLink,
  SectionHeading,
} from '../HudKit';
import { TRACKS } from '../../data/tracks';
import type { Track } from '../../data/tracks';

/** 秒を M:SS 表記にする(NaN / Infinity / 負値は 0:00 扱い)。 */
function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 歌詞テキストを「空行区切りのブロック」配列に分割する(各ブロックは改行付きの1文字列)。 */
function splitStanzas(lyrics: string): string[] {
  return lyrics
    .trim()
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 再生中インジケータ(アクセント色のドット + ON AIR)。 */
function OnAirTag() {
  return (
    <MonoTag>
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{
          background: 'var(--page-accent, #05d9e8)',
          boxShadow: '0 0 6px var(--page-accent, #05d9e8)',
        }}
      />
      <span style={{ color: 'var(--page-accent, #05d9e8)' }}>ON AIR</span>
    </MonoTag>
  );
}

/** CD 盤面(画像 or グラデ)。中央ハブ + 穴 + 光沢は回転しない静的レイヤに分離する。 */
function Disc({ track, playing }: { track: Track; playing: boolean }) {
  return (
    <div className="relative h-48 w-48 sm:h-52 sm:w-52">
      {/* 回転する盤面(再生中のみ回る)。曲切替で key が変わり差し替わる。 */}
      <div
        key={track.id}
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          boxShadow: `0 14px 36px rgba(0, 0, 0, 0.55), 0 0 26px ${track.art.glow}33`,
          animation: 'rp-spin 5s linear infinite',
          animationPlayState: playing ? 'running' : 'paused',
        }}
      >
        {track.art.image ? (
          <img
            src={track.art.image}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${track.art.c1}, ${track.art.c2})`,
            }}
          >
            <span
              className="text-3xl font-bold text-white/90"
              style={{ fontFamily: MONO, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
            >
              {track.art.initials}
            </span>
          </div>
        )}
      </div>

      {/* CD の光沢(光源は回らないので静的に重ねる) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full opacity-80"
        style={{
          background:
            'conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.16), transparent 17%, rgba(255,255,255,0.05) 42%, transparent 60%, rgba(255,255,255,0.11) 80%, transparent 96%)',
        }}
      />

      {/* 中央ハブ + 穴(CD の中心・回転しても対称なので静的) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            height: '13%',
            width: '13%',
            background: 'rgba(10, 15, 26, 0.28)',
            border: '1px solid rgba(255, 255, 255, 0.55)',
            boxShadow: '0 0 5px rgba(0,0,0,0.45)',
          }}
        >
          <span
            className="rounded-full"
            style={{
              height: '32%',
              width: '32%',
              background: '#0a0f1a',
              boxShadow: 'inset 0 0 2px rgba(0,0,0,0.9)',
            }}
          />
        </span>
      </div>

      {/* 外周リング(輪郭の締め) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border border-white/15"
      />
    </div>
  );
}

export function RecordPlayer() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const track = TRACKS[index];
  const hasAudio = Boolean(track.src);
  const stanzas = track.lyrics ? splitStanzas(track.lyrics) : [];

  // アンマウント時に再生を止める(ページ遷移後に音だけ残るのを防ぐ)。
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  /**
   * 曲を選択する(前後ボタンはループ: 先頭の前は最後尾)。
   * 切替時は必ず停止・リセットし、自動では鳴らさない(再生はユーザー操作起点のみ)。
   */
  const selectTrack = (next: number) => {
    const normalized = ((next % TRACKS.length) + TRACKS.length) % TRACKS.length;
    if (normalized === index) return;
    audioRef.current?.pause();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIndex(normalized);
  };

  /** 再生/一時停止。play() の失敗(自動再生制限等)は catch して再生状態を戻す。 */
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    audio.play().catch(() => {
      setPlaying(false);
    });
  };

  /** 再生終了: 次の曲を選択状態にするだけで、自動では再生しない。 */
  const handleEnded = () => {
    setPlaying(false);
    selectTrack(index + 1);
  };

  /** シークバー操作。音源のあるときだけ反映する。 */
  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !hasAudio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const seekMax = duration > 0 ? duration : 1;

  /**
   * プレイリスト行の再生時間ラベル。
   *   durationLabel 優先 → 現在曲は実測 → 音源ありで不明は '-:--' → 音源なしは null(SOON)。
   */
  const timeLabel = (t: Track, i: number): string | null => {
    if (!t.src) return null;
    if (t.durationLabel) return t.durationLabel;
    if (i === index && duration > 0) return formatTime(duration);
    return '-:--';
  };

  return (
    <>
      {/* 盤の回転キーフレーム(このコンポーネント専用) */}
      <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>

      <HudCard pad={false}>
        <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
          {/* ==== 左: CD + シーク + 操作 ==== */}
          <div className="flex flex-col items-center gap-3.5 border-b border-white/10 bg-[#0a0f1a] p-5 md:border-b-0 md:border-r">
            <div aria-hidden="true" className="mt-1 select-none">
              <Disc track={track} playing={playing} />
            </div>

            {/* 曲名 + タグ */}
            <div className="w-full min-w-0 text-center">
              <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2">
                <MonoTag>{track.sub}</MonoTag>
                {track.date && <MonoTag>{track.date}</MonoTag>}
                {playing && <OnAirTag />}
              </div>
              <h2 className="truncate text-base font-bold text-white">
                {track.title}
              </h2>
            </div>

            {/* シークバー + 時刻 */}
            <div className="flex w-full items-center gap-3">
              <input
                type="range"
                min={0}
                max={seekMax}
                step={0.1}
                value={Math.min(currentTime, seekMax)}
                onChange={handleSeek}
                disabled={!hasAudio}
                aria-label="再生位置"
                className="w-full min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                style={{ accentColor: 'var(--page-accent, #05d9e8)' }}
              />
              <span
                className="shrink-0 text-[11px] tabular-nums text-white/60"
                style={{ fontFamily: MONO }}
              >
                {hasAudio
                  ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                  : '-:-- / -:--'}
              </span>
            </div>

            {/* 操作ボタン(前 / 再生 / 次) */}
            <div className="flex items-center gap-2.5">
              <NeonButton
                subtle
                type="button"
                onClick={() => selectTrack(index - 1)}
                aria-label="前の曲"
              >
                ◂◂
              </NeonButton>
              <NeonButton
                type="button"
                onClick={togglePlay}
                disabled={!hasAudio}
                aria-label={playing ? '一時停止' : '再生'}
              >
                {playing ? '■' : '▶'}
              </NeonButton>
              <NeonButton
                subtle
                type="button"
                onClick={() => selectTrack(index + 1)}
                aria-label="次の曲"
              >
                ▸▸
              </NeonButton>
            </div>

            {/* 現在曲に YouTube URL があればリンク(今は未設定=非表示) */}
            {track.youtubeUrl && (
              <NeonLink
                subtle
                href={track.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                YOUTUBE ↗
              </NeonLink>
            )}

            {/* オーディオ本体(1 個だけ。曲切替は src 差し替え) */}
            <audio
              ref={audioRef}
              src={track.src}
              preload="none"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={handleEnded}
            />
          </div>

          {/* ==== 右: 曲リスト(スクロール)==== */}
          <div className="flex min-w-0 flex-col p-4 sm:p-5">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <MonoTag>PLAYLIST</MonoTag>
              <span
                className="text-[11px] tracking-wider text-white/40"
                style={{ fontFamily: MONO }}
              >
                {String(TRACKS.length).padStart(2, '0')} TRACKS
              </span>
            </div>
            <ul className="max-h-[320px] divide-y divide-white/5 overflow-y-auto rounded-lg border border-white/10 md:max-h-[372px]">
              {TRACKS.map((t, i) => {
                const active = i === index;
                const tl = timeLabel(t, i);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectTrack(i)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-white/[0.05]'
                          : 'border-transparent hover:bg-white/[0.04]'
                      }`}
                      style={
                        active
                          ? { borderLeftColor: 'var(--page-accent, #05d9e8)' }
                          : undefined
                      }
                    >
                      {/* 最小化アイコン(盤面画像 or グラデ) */}
                      <span
                        aria-hidden="true"
                        className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15"
                        style={{
                          boxShadow: active ? `0 0 8px ${t.art.glow}66` : 'none',
                        }}
                      >
                        {t.art.image ? (
                          <img
                            src={t.art.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span
                            className="block h-full w-full"
                            style={{
                              background: `linear-gradient(135deg, ${t.art.c1}, ${t.art.c2})`,
                            }}
                          />
                        )}
                      </span>
                      {/* 曲名 */}
                      <span
                        className={`flex-1 truncate text-sm ${
                          active ? 'font-semibold text-white' : 'text-white/80'
                        }`}
                      >
                        {t.title}
                      </span>
                      {/* 再生時間 or SOON */}
                      {tl ? (
                        <span
                          className="shrink-0 text-[11px] tabular-nums text-white/50"
                          style={{ fontFamily: MONO }}
                        >
                          {tl}
                        </span>
                      ) : (
                        <MonoTag className="shrink-0">SOON</MonoTag>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </HudCard>

      {/* ==== 歌詞(選択中の曲)==== */}
      <section className="mt-8">
        <SectionHeading>歌詞</SectionHeading>
        <HudCard>
          {track.lyrics ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <MonoTag>{track.sub}</MonoTag>
                <span className="text-sm font-semibold text-white">
                  {track.title}
                </span>
                <button
                  type="button"
                  onClick={() => setShowLyrics((v) => !v)}
                  aria-expanded={showLyrics}
                  className="ml-auto shrink-0 tracking-wider text-white/55 transition-colors hover:text-white"
                  style={{ fontFamily: MONO, fontSize: 11 }}
                >
                  {showLyrics ? '［ − 隠す ］' : '［ ＋ 表示 ］'}
                </button>
              </div>
              {showLyrics && (
                <div className="space-y-4">
                  {stanzas.map((stanza, i) => (
                    <p
                      key={i}
                      className="whitespace-pre-line text-sm leading-loose text-white/85"
                    >
                      {stanza}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/60">この曲の歌詞は準備中です。</p>
          )}
        </HudCard>
      </section>
    </>
  );
}
