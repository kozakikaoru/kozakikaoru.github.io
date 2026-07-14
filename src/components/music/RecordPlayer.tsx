// 音楽プレイヤー(PC は 2 カラム構成)。
//   - 左: 枠なし・列いっぱいの正方形アート(静止)+ 曲名/制作日 + フルwシークバー
//         (下に現在/総時間)+ 枠なしの操作ボタン(前/再生/次)
//   - 右: 曲リスト(スクロール・ヘッダなし)。各行 = アイコン + 曲名 + 再生時間。
//         アイコンは通常は正方形、選択中は丸、再生中はさらに回転する。音源なしは SOON。
//   - 下: 選択中の曲の歌詞(空行でブロック分割・表示/隠すトグル)
// 音源(Track.src)が無い曲は再生系 UI を無効化する。<audio> は 1 個・曲切替は src 差し替え。
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { HudCard, MONO, MonoTag, NeonLink, SectionHeading } from '../HudKit';
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

// 操作アイコン(枠なし・currentColor で塗り)。
function IconPrev() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M7 6h2.2v12H7z" />
      <path d="M20 6v12l-9-6z" />
    </svg>
  );
}
function IconNext() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
      <path d="M4 6l9 6-9 6z" />
      <path d="M14.8 6H17v12h-2.2z" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
      <path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" />
    </svg>
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
      {/* 再生中の曲アイコンの回転(このコンポーネント専用) */}
      <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>

      <HudCard pad={false}>
        <div className="grid md:grid-cols-[316px_minmax(0,1fr)]">
          {/* ==== 左: アート + 曲名 + シーク + 操作 ==== */}
          <div className="flex flex-col border-b border-white/10 bg-[#0a0f1a] md:border-b-0 md:border-r">
            {/* 正方形の大きなアート(静止・枠なし・列いっぱい)。カードの overflow-hidden が角丸を担う。 */}
            <div className="relative aspect-square w-full overflow-hidden">
              {track.art.image ? (
                <img
                  src={track.art.image}
                  alt={track.title}
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
                    className="text-5xl font-bold text-white/90"
                    style={{ fontFamily: MONO, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                  >
                    {track.art.initials}
                  </span>
                </div>
              )}
            </div>

            {/* 操作エリア(余白あり) */}
            <div className="flex flex-col items-center gap-2.5 p-3.5">
              {/* 曲名 + 制作日 */}
              <div className="w-full min-w-0 text-center">
                <h2 className="truncate text-base font-bold text-white">
                  {track.title}
                </h2>
                {track.date && (
                  <p
                    className="mt-0.5 text-[11px] tracking-wider text-white/45"
                    style={{ fontFamily: MONO }}
                  >
                    {track.date}
                  </p>
                )}
              </div>

              {/* フル幅シークバー + 現在/総時間(YouTube Music 風に左右へ) */}
              <div className="w-full">
                <input
                  type="range"
                  min={0}
                  max={seekMax}
                  step={0.1}
                  value={Math.min(currentTime, seekMax)}
                  onChange={handleSeek}
                  disabled={!hasAudio}
                  aria-label="再生位置"
                  className="block w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ accentColor: 'var(--page-accent, #05d9e8)' }}
                />
                <div
                  className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-white/55"
                  style={{ fontFamily: MONO }}
                >
                  <span>{hasAudio ? formatTime(currentTime) : '0:00'}</span>
                  <span>{hasAudio ? formatTime(duration) : '0:00'}</span>
                </div>
              </div>

              {/* 操作ボタン(枠なし・前/次は大きめアイコン・再生は塗り丸) */}
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => selectTrack(index - 1)}
                  aria-label="前の曲"
                  className="p-1 text-white/70 transition-colors hover:text-white"
                >
                  <IconPrev />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!hasAudio}
                  aria-label={playing ? '一時停止' : '再生'}
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[#06121f] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  style={{
                    background: 'var(--page-accent, #05d9e8)',
                    boxShadow:
                      '0 0 16px color-mix(in srgb, var(--page-accent, #05d9e8) 45%, transparent)',
                  }}
                >
                  {playing ? <IconPause /> : <IconPlay />}
                </button>
                <button
                  type="button"
                  onClick={() => selectTrack(index + 1)}
                  aria-label="次の曲"
                  className="p-1 text-white/70 transition-colors hover:text-white"
                >
                  <IconNext />
                </button>
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
            </div>

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

          {/* ==== 右: 曲リスト(ヘッダなし・スクロール)==== */}
          <div className="min-w-0 p-3 sm:p-4">
            <ul className="max-h-[320px] divide-y divide-white/5 overflow-y-auto md:max-h-[440px]">
              {TRACKS.map((t, i) => {
                const active = i === index;
                const spinning = active && playing;
                const tl = timeLabel(t, i);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectTrack(i)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 border-l-2 px-3 py-3 text-left transition-colors ${
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
                      {/* アイコン: 通常は正方形 / 選択中は丸 / 再生中はさらに回転 */}
                      <span
                        aria-hidden="true"
                        className={`h-10 w-10 shrink-0 overflow-hidden border border-white/15 ${
                          active ? 'rounded-full' : 'rounded-md'
                        }`}
                        style={{
                          boxShadow: active ? `0 0 8px ${t.art.glow}66` : 'none',
                          animation: spinning ? 'rp-spin 4s linear infinite' : 'none',
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
