// 全ページ共通の背景。時間帯(day/evening/night)に応じた画像を表示し、
// 切替時は opacity クロスフェードでふわっと変える。3枚を常時 DOM に置き、
// 表示中のものだけ opacity:1 にすることでちらつきなく重ねる。
// 画像は無劣化方針で WebP(lossless)を主に使用(<picture> で AVIF も候補に)。
import { BACKGROUNDS } from '../lib/backgrounds';
import { TIME_OF_DAY_ORDER } from '../lib/timeOfDay';
import { useEffectiveTimeOfDay } from '../store/useAppStore';

export function TimeBackground() {
  const current = useEffectiveTimeOfDay();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0b1220]"
    >
      {TIME_OF_DAY_ORDER.map((tod) => {
        const asset = BACKGROUNDS[tod];
        const visible = tod === current;
        return (
          <picture key={tod}>
            <source srcSet={asset.avif} type="image/avif" />
            <source srcSet={asset.webp} type="image/webp" />
            <img
              src={asset.webp}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out will-change-[opacity]"
              style={{ opacity: visible ? 1 : 0 }}
            />
          </picture>
        );
      })}

      {/* 上に薄いグラデーションを重ね、白い花畑の上でも文字が読めるようにする。 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 15%, rgba(6,12,26,0.05) 0%, rgba(6,12,26,0.25) 55%, rgba(6,12,26,0.55) 100%)',
        }}
      />

      {/* ネオングリッド(地面を走る光)。世界観「デジタルの光」の演出。 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(77,208,225,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(77,208,225,0.35) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
      />
    </div>
  );
}
