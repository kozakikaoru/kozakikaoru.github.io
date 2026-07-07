// 初期表示に必要なアセット(背景画像・プロフィール写真・自己ホストフォント)を先読みし、
// 進捗(0..1)と完了を zustand ストアに反映するフック。ローディング画面はこの進捗を見て演出する。
//
// 重要: フォントの読込を完了判定に含める。これを待たずにローディングを消すと、
// フォント適用が後追いになってレイアウトがガタつく(FOUT)。
// - WDXL Lubrifont JP N: 3D パネル中央ラベル(FontFace API・labelFonts.ts)
// - Dela Gothic One: 各ページ見出し(index.css の @font-face・font-display: swap)
import { useEffect } from 'react';
import { allBackgroundUrls } from '../lib/backgrounds';
import { useAppStore } from '../store/useAppStore';
import { loadLabelFonts } from '../three/hud/labelFonts';
import profilePhotoUrl from '../assets/profile/kozaki-kaoru.webp';

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    // 失敗しても進捗は進める(ローディングで詰まらせない)。
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

// 自己ホストフォントを先読みする。WDXL は共有 Promise(labelFonts)で、
// Dela は CSS @font-face なので document.fonts.load で明示的に要求して待つ
// (使用テキストが描画されるまで自動では読まれないため)。いずれもサブセット済みで数 KB。
function preloadFonts(): Promise<void> {
  const tasks: Promise<unknown>[] = [loadLabelFonts()];
  if (typeof document !== 'undefined' && 'fonts' in document) {
    tasks.push(
      document.fonts.load("400 1em 'Dela Gothic One'").catch(() => undefined),
    );
  }
  return Promise.all(tasks).then(() => undefined);
}

export function usePreloadImages() {
  const setLoadProgress = useAppStore((s) => s.setLoadProgress);
  const setLoaded = useAppStore((s) => s.setLoaded);

  useEffect(() => {
    let cancelled = false;

    // 最低表示時間を設けて、一瞬でローディングが消える不自然さを防ぐ。
    const started = performance.now();
    const MIN_MS = 900;

    (async () => {
      // ブラウザが実際に表示する形式(AVIF or WebP)を先読みする。
      const bgUrls = await allBackgroundUrls().catch(() => [] as string[]);
      if (cancelled) return;

      // 先読み対象 = 背景画像 + プロフィール写真 + フォント一式(1 枠として計上)。
      const imageUrls = [...bgUrls, profilePhotoUrl];
      const total = imageUrls.length + 1;
      let done = 0;
      const tick = () => {
        if (cancelled) return;
        done += 1;
        setLoadProgress(Math.min(1, done / total));
      };

      await Promise.all([
        ...imageUrls.map((u) => loadImage(u).then(tick)),
        preloadFonts().then(tick, tick),
      ]);
      if (cancelled) return;

      // フォント適用(レイアウト確定)まで確実に待ってから表示する。
      if (typeof document !== 'undefined' && 'fonts' in document) {
        await document.fonts.ready.catch(() => undefined);
      }
      if (cancelled) return;

      const elapsed = performance.now() - started;
      if (elapsed < MIN_MS) {
        await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
      }
      if (cancelled) return;
      setLoadProgress(1);
      setLoaded(true);
    })().catch(() => {
      // 何かあってもローディングで詰まらせない。
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [setLoadProgress, setLoaded]);
}
