// アプリ全体で共有する状態(zustand)。
// - 背景の時間帯: 自動判定 + 手動上書き(手動が優先)
// - ローディング状態: 初期ロードの進捗と完了フラグ
// - 音楽プレイヤー: 全ページ横断で継続再生するための再生状態(実体の <audio> は
//   GlobalAudioPlayer が持ち、ここは「どの曲・再生中か・位置」だけを持つ)
import { create } from 'zustand';
import {
  currentTimeOfDay,
  timeOfDayFromHour,
  type TimeOfDay,
} from '../lib/timeOfDay';
import { TRACKS } from '../data/tracks';

/** 曲番号を [0, TRACKS.length) に正規化(負値・オーバーは循環)。 */
function wrapIndex(i: number): number {
  const n = TRACKS.length;
  return ((i % n) + n) % n;
}

interface AppState {
  // ---- 背景(時間帯) ----
  /** 端末時刻から自動判定した時間帯。 */
  autoTimeOfDay: TimeOfDay;
  /** 手動で選択した時間帯。null なら自動に従う。 */
  manualTimeOfDay: TimeOfDay | null;
  /** 実際に表示する時間帯(手動が優先)。セレクタで取得推奨。 */
  setManualTimeOfDay: (t: TimeOfDay | null) => void;
  /** 端末時刻の再判定(タブ復帰時などに呼ぶ)。手動選択中は表示に影響しない。 */
  refreshAutoTimeOfDay: () => void;

  // ---- ローディング ----
  /** 0〜1 の進捗。 */
  loadProgress: number;
  /** 初期ロードが完了したか。 */
  isLoaded: boolean;
  setLoadProgress: (p: number) => void;
  setLoaded: (v: boolean) => void;

  // ---- 音楽プレイヤー(全ページ横断で継続再生)----
  /** 再生対象の曲番号(TRACKS のインデックス)。 */
  trackIndex: number;
  /** 再生中か。 */
  isPlaying: boolean;
  /** 現在の再生位置(秒)。 */
  currentTime: number;
  /** 現在曲の総再生時間(秒)。 */
  duration: number;
  /** シーク要求のトークン。増えると GlobalAudioPlayer が currentTime を <audio> に反映する。 */
  seekToken: number;
  /** 曲を選ぶ。同じ曲なら再生/一時停止トグル、別の曲なら頭から再生。 */
  playIndex: (i: number) => void;
  /** 再生/一時停止トグル(サウンドボタン・再生ボタン共通)。 */
  togglePlay: () => void;
  /** 再生状態を直接セットする(<audio> の play 失敗時の巻き戻し等)。 */
  setPlaying: (v: boolean) => void;
  /** 次の曲へ。autoplay=true なら必ず再生(曲終わりの連続再生用)、未指定は現在の再生状態を維持。 */
  nextTrack: (autoplay?: boolean) => void;
  /** 前の曲へ(現在の再生状態を維持)。 */
  prevTrack: () => void;
  /** 再生位置を移動する。 */
  seek: (t: number) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  autoTimeOfDay: currentTimeOfDay(),
  manualTimeOfDay: null,
  setManualTimeOfDay: (t) => set({ manualTimeOfDay: t }),
  refreshAutoTimeOfDay: () =>
    set({ autoTimeOfDay: timeOfDayFromHour(new Date().getHours()) }),

  loadProgress: 0,
  isLoaded: false,
  setLoadProgress: (p) => set({ loadProgress: Math.min(1, Math.max(0, p)) }),
  setLoaded: (v) => set({ isLoaded: v }),

  // ---- 音楽プレイヤー ----
  trackIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  seekToken: 0,
  playIndex: (i) =>
    set((s) => {
      const n = wrapIndex(i);
      if (n === s.trackIndex) return { isPlaying: !s.isPlaying };
      return { trackIndex: n, isPlaying: true, currentTime: 0, duration: 0 };
    }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (v) => set({ isPlaying: v }),
  nextTrack: (autoplay) =>
    set((s) => ({
      trackIndex: wrapIndex(s.trackIndex + 1),
      currentTime: 0,
      duration: 0,
      isPlaying: autoplay ?? s.isPlaying,
    })),
  prevTrack: () =>
    set((s) => ({
      trackIndex: wrapIndex(s.trackIndex - 1),
      currentTime: 0,
      duration: 0,
      isPlaying: s.isPlaying,
    })),
  seek: (t) => set((s) => ({ currentTime: t, seekToken: s.seekToken + 1 })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
}));

/** 実際に表示すべき時間帯(手動選択があればそれ、なければ自動)。 */
export function useEffectiveTimeOfDay(): TimeOfDay {
  return useAppStore((s) => s.manualTimeOfDay ?? s.autoTimeOfDay);
}
