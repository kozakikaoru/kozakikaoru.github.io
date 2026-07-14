// レコード/ターンテーブル風の試聴プレイヤー(画像アセット無し・CSS と SVG だけで描画)。
//   - 左: 回転するレコード盤(再生中のみ回る)+ トーンアーム(すべて装飾 = aria-hidden)
//   - 右: 現在曲の情報とコントロール(前後・再生/一時停止・シーク)
//   - 下: プレイリスト(クリックで曲切替。切替時は必ず停止し、再生はユーザー操作起点のみ)
// 音源(Track.src)が無い曲は COMING SOON 表示にして再生系 UI を無効化する。
// <audio> は 1 個だけ持ち、曲切替は src の差し替えで行う(src 変更でブラウザ側も自動リセット)。
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
      // 自動再生制限やロード失敗で再生できなかったときは状態を戻す。
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

  return (
    <>
      {/* 盤の回転とラベル切替のキーフレーム(このコンポーネント専用) */}
      <style>{`
        @keyframes rp-spin { to { transform: rotate(360deg); } }
        @keyframes rp-label-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <HudCard pad={false}>
        <div className="grid md:grid-cols-[minmax(0,380px)_1fr]">
          {/* ==== 左: ターンテーブル(すべて装飾) ==== */}
          <div
            aria-hidden="true"
            className="relative flex select-none flex-col items-center justify-center gap-6 border-b border-white/10 bg-[#0a0f1a] p-8 sm:p-10 md:border-b-0 md:border-r"
          >
            {/* レコード盤(再生中のみ回転) */}
            <div className="relative">
              <div
                className="relative flex h-64 w-64 items-center justify-center rounded-full border border-white/10 sm:h-72 sm:w-72"
                style={{
                  // 溝: 同心円の繰り返しで vinyl 質感を出す
                  background:
                    'repeating-radial-gradient(circle at 50% 50%, #16181f 0 1.5px, #0b0d13 1.5px 3px)',
                  boxShadow: '0 14px 40px rgba(0, 0, 0, 0.55)',
                  animation: 'rp-spin 4s linear infinite',
                  animationPlayState: playing ? 'running' : 'paused',
                }}
              >
                {/* 中央ラベル(曲切替で key が変わり、ふわっと出る) */}
                <div
                  key={track.id}
                  className="flex h-[42%] w-[42%] flex-col items-center justify-center rounded-full border border-white/15"
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${track.art.c1}, ${track.art.c2})`,
                    boxShadow: `0 0 24px ${track.art.glow}55`,
                    animation: 'rp-label-in 0.5s ease',
                  }}
                >
                  <span
                    className="text-2xl font-bold text-white"
                    style={{
                      fontFamily: MONO,
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    {track.art.initials}
                  </span>
                  {/* スピンドル(中心の白点) */}
                  <span
                    className="my-1 h-1.5 w-1.5 rounded-full bg-white/90"
                    style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)' }}
                  />
                  <span
                    className="text-[9px] tracking-[0.2em] text-white/85"
                    style={{ fontFamily: MONO }}
                  >
                    {track.sub}
                  </span>
                </div>
              </div>
              {/* 盤面の静的ハイライト(光源は回らないので、回転する盤の上に重ねる) */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-70"
                style={{
                  background:
                    'conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.10), transparent 16%, rgba(255,255,255,0.04) 40%, transparent 58%, rgba(255,255,255,0.08) 78%, transparent 94%)',
                }}
              />
            </div>

            {/* トーンアーム(右上が支点。再生中は盤の上へ降りる) */}
            <svg
              viewBox="0 0 100 100"
              className="absolute right-2 top-2 h-36 w-36 sm:h-40 sm:w-40"
              style={{
                transform: playing ? 'rotate(-12deg)' : 'rotate(-28deg)',
                transformOrigin: '76% 22%',
                transition: 'transform 0.6s ease',
              }}
            >
              {/* 支点ベース */}
              <circle
                cx="76"
                cy="22"
                r="7"
                fill="#161f30"
                stroke="rgba(255, 255, 255, 0.22)"
                strokeWidth="1.5"
              />
              <circle cx="76" cy="22" r="2.5" fill="rgba(255, 255, 255, 0.55)" />
              {/* アーム */}
              <line
                x1="76"
                y1="22"
                x2="42"
                y2="76"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* ヘッドシェル */}
              <rect
                x="36"
                y="72"
                width="11"
                height="9"
                rx="2"
                fill="#1d2739"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                transform="rotate(-32 41.5 76.5)"
              />
            </svg>

            {/* 計器行 */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <MonoTag>33 RPM</MonoTag>
              <MonoTag>STEREO</MonoTag>
              {playing && <OnAirTag />}
            </div>
          </div>

          {/* ==== 右: 曲情報 + コントロール ==== */}
          <div className="flex flex-col justify-center gap-5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <MonoTag>
                {track.sub} / {String(TRACKS.length).padStart(2, '0')}
              </MonoTag>
              {track.date && <MonoTag>{track.date}</MonoTag>}
              {playing && <OnAirTag />}
              {!hasAudio && <MonoTag>AUDIO COMING SOON</MonoTag>}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{track.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {track.desc}
              </p>
            </div>

            {/* コントロール行 */}
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

            {/* シークバー + 時刻 */}
            <div className="flex items-center gap-3">
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

            {/* 音源未提供の案内(YouTube URL があるときだけリンクを出す。href="#" は使わない) */}
            {!hasAudio && (
              <div className="flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-white/60">
                  音源は準備中です。公開までもう少しお待ちください。
                </p>
                {track.youtubeUrl && (
                  <NeonLink
                    href={track.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start"
                  >
                    YOUTUBE ↗
                  </NeonLink>
                )}
              </div>
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

          {/* ==== 下: プレイリスト ==== */}
          <div className="border-t border-white/10 md:col-span-2">
            <ul>
              {TRACKS.map((t, i) => {
                const active = i === index;
                return (
                  <li key={t.id} className="border-b border-white/5 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => selectTrack(i)}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 border-l-2 px-5 py-3 text-left transition-colors sm:px-6 ${
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
                      <span
                        className="w-6 shrink-0 text-[11px] text-white/45"
                        style={{ fontFamily: MONO }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {/* レーベル配色のスウォッチ */}
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20"
                        style={{
                          background: `linear-gradient(135deg, ${t.art.c1}, ${t.art.c2})`,
                          boxShadow: active ? `0 0 8px ${t.art.glow}66` : 'none',
                        }}
                      />
                      <span
                        className={`flex-1 truncate text-sm ${
                          active ? 'font-semibold text-white' : 'text-white/80'
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.src ? (
                        <span
                          className="shrink-0 text-[11px] tabular-nums text-white/50"
                          style={{ fontFamily: MONO }}
                        >
                          {active && duration > 0 ? formatTime(duration) : '-:--'}
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
