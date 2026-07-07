// パネル中央の日本語ラベル(makeLabelTexture)用の自己ホスト Web フォント。
// ヒーロー5枚のラベルは WDXL Lubrifont JP N に統一。Google Fonts の text= サブセット
//   woff2 を同梱し、FontFace API で読み込む(外部リクエストなし = GitHub Pages でもオフライン動作)。
//   ※ 詳細ページの見出し(PageShell h1)用の Dela Gothic One は DOM テキストなので、
//     こちらではなく index.css の @font-face で別途読み込む(役割分担)。
//
// 重要:
//   - WDXL Lubrifont JP N は単一ウェイト(400)のディスプレイ体。canvas で bold 指定すると
//     faux-bold(合成太字)で字形が崩れるため weight は '400' を使う(system フォールバックのみ bold)。
//   - フォントは非同期読込。読込前は fallback で焼かれるので、読込完了後にラベルテクスチャを
//     再生成する必要がある(useLabelFontsReady を useMemo deps に入れる)。
import { useSyncExternalStore } from 'react';
import wdxlUrl from '../../assets/fonts/WDXLLubrifontJPN-subset.woff2';

export type LabelFontKey = 'wdxl' | 'system';

const FALLBACK =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif";

export interface LabelFontSpec {
  /** canvas ctx.font の font-family(フォールバック付き)。 */
  family: string;
  /** canvas ctx.font の font-weight。ディスプレイ体は '400'(faux-bold 回避)。 */
  weight: string;
}

export const LABEL_FONTS: Record<LabelFontKey, LabelFontSpec> = {
  wdxl: { family: `'WDXL Lubrifont JP N', ${FALLBACK}`, weight: '400' },
  system: { family: FALLBACK, weight: 'bold' },
};

// 読込する FontFace 定義(family 名は Google Fonts と一致させる)。
const FACES: { family: string; url: string }[] = [
  { family: 'WDXL Lubrifont JP N', url: wdxlUrl },
];

let ready = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

/**
 * 同梱ラベルフォント(WDXL)の読込を開始し、完了で解決する共有 Promise を返す。
 * 複数箇所から呼ばれても実読込は一度だけ(結果を共有)。ラベルテクスチャの再生成
 * (useLabelFontsReady)に加え、初期ローディングの完了判定(usePreloadImages)からも
 * この Promise を await することで、フォント適用前にサイトが表示されてガタつく(FOUT)
 * のを防ぐ。
 */
export function loadLabelFonts(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    ready = true; // 非対応環境はフォールバックのまま「準備完了」とみなす
    loadPromise = Promise.resolve();
    return loadPromise;
  }
  loadPromise = Promise.all(
    FACES.map((f) => {
      const face = new FontFace(f.family, `url(${f.url})`);
      return face
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        })
        .catch(() => {
          /* 失敗時はフォールバックのまま */
        });
    }),
  ).then(() => {
    ready = true;
    listeners.forEach((l) => l());
  });
  return loadPromise;
}

function subscribe(cb: () => void): () => void {
  void loadLabelFonts();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * 同梱 Web フォントの読込完了フラグ。false→true に一度だけ遷移する。
 * ラベルテクスチャ useMemo の deps に入れて、読込後に正しいフォントで再生成させる。
 */
export function useLabelFontsReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false, // SSR スナップショット
  );
}
