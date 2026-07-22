// ヘッダーのサウンドボタン。押すと全体の再生/一時停止をトグルする。
// 再生中はスピーカー(音波つき)、停止中はスピーカーにスラッシュ(消音)を表示。
// 実体は GlobalAudioPlayer が持ち、状態は useAppStore を参照する。
import { useAppStore } from '../store/useAppStore';

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* スピーカー本体(塗り) */}
      <path d="M4 9v6h3.6L13 19V5L7.6 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          {/* 音波 */}
          <path d="M16.5 8.8a4.6 4.6 0 0 1 0 6.4" />
          <path d="M19.2 6.2a8.2 8.2 0 0 1 0 11.6" />
        </>
      ) : (
        <>
          {/* 消音のスラッシュ(×) */}
          <path d="M16.5 9.5l5 5" />
          <path d="M21.5 9.5l-5 5" />
        </>
      )}
    </svg>
  );
}

export function SoundToggle() {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const togglePlay = useAppStore((s) => s.togglePlay);
  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={isPlaying ? '音を止める' : '音を再生する'}
      aria-pressed={isPlaying}
      title={isPlaying ? '音を止める' : '音を再生する'}
      className="glass-dark inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
    >
      <SoundIcon on={isPlaying} />
    </button>
  );
}
