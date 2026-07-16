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
              // 背景は横長(1672x941)なので、縦長のスマホでは左右が大きく切り落とされる。
              // 既定の object-position(中央)だと、花が密集した左側が切れて、空と水面
              // ばかりの中央だけが残る。スマホ幅では切り出しをほぼ左端(5%)まで寄せて
              // 花畑を主役にする(左に 5% だけ余白を残す = 元画像の左端は少し切る)。
              // sm(640px)以上は横幅が足りるので従来どおり中央。
              className="absolute inset-0 h-full w-full object-cover object-[5%_center] transition-opacity duration-[1200ms] ease-in-out will-change-[opacity] sm:object-center"
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

      {/* 旧: 画面下部のネオングリッド(パースの掛かった格子)はユーザー指示で撤去。
          背景写真そのものに写り込んでいる光の線とは別物(あちらは画像由来)。 */}
    </div>
  );
}
