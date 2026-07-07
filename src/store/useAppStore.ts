// アプリ全体で共有する状態(zustand)。
// - 背景の時間帯: 自動判定 + 手動上書き(手動が優先)
// - ローディング状態: 初期ロードの進捗と完了フラグ
import { create } from 'zustand';
import {
  currentTimeOfDay,
  timeOfDayFromHour,
  type TimeOfDay,
} from '../lib/timeOfDay';

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
}));

/** 実際に表示すべき時間帯(手動選択があればそれ、なければ自動)。 */
export function useEffectiveTimeOfDay(): TimeOfDay {
  return useAppStore((s) => s.manualTimeOfDay ?? s.autoTimeOfDay);
}
