// 背景画像アセットの一元管理。
// 無劣化(ロスレス)方針: WebP lossless を第一候補(src)にし、
// AVIF(高品質)は容量削減の補助として <picture> の候補に添える。
// Vite が import を解決してハッシュ付き URL を返す。
import type { TimeOfDay } from './timeOfDay';

import morningWebp from '../assets/backgrounds/margaret-morning.webp';
import dayWebp from '../assets/backgrounds/margaret-day.webp';
import eveningWebp from '../assets/backgrounds/margaret-evening.webp';
import nightWebp from '../assets/backgrounds/margaret-night.webp';

import morningAvif from '../assets/backgrounds/margaret-morning.avif';
import dayAvif from '../assets/backgrounds/margaret-day.avif';
import eveningAvif from '../assets/backgrounds/margaret-evening.avif';
import nightAvif from '../assets/backgrounds/margaret-night.avif';

export interface BackgroundAsset {
  /** ロスレス WebP。無劣化方針の第一候補。 */
  webp: string;
  /** 高品質 AVIF。容量削減の補助(厳密ロスレスではない)。 */
  avif: string;
  /** 代替テキスト。 */
  alt: string;
}

export const BACKGROUNDS: Record<TimeOfDay, BackgroundAsset> = {
  morning: { webp: morningWebp, avif: morningAvif, alt: '朝のマーガレット畑' },
  day: { webp: dayWebp, avif: dayAvif, alt: '昼のマーガレット畑' },
  evening: { webp: eveningWebp, avif: eveningAvif, alt: '夕方のマーガレット畑' },
  night: { webp: nightWebp, avif: nightAvif, alt: '夜のマーガレット畑' },
};

/** ブラウザが AVIF をデコードできるか(1x1 の AVIF を試す)。 */
function supportsAvif(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  // 1x1 の最小 AVIF(データURI)。デコードできれば AVIF 対応とみなす。
  const DATA =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = DATA;
  });
}

/**
 * preload 対象の全 URL(ローディング時に先読みする)。
 * <picture> は AVIF→WebP の順に選ぶため、ブラウザが実際に表示する形式を
 * 先読みする(WebP を必ず読むとダウンロードが二重になり無駄になる)。
 */
export async function allBackgroundUrls(): Promise<string[]> {
  const avif = await supportsAvif();
  return Object.values(BACKGROUNDS).map((b) => (avif ? b.avif : b.webp));
}
