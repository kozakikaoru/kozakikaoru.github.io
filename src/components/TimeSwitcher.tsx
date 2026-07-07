// 背景の時間帯を手動で切り替えるボタン群(朝/昼/夕方/夜)。
// 手動選択は自動判定より優先。「自動」を選ぶと端末時刻に戻る。
// アイコン(絵文字)は使わずテキストラベルのみ(サイト全体で絵文字を廃止)。
import { TIME_OF_DAY_ORDER, TIME_OF_DAY_LABEL } from '../lib/timeOfDay';
import { useAppStore } from '../store/useAppStore';

export function TimeSwitcher() {
  const manual = useAppStore((s) => s.manualTimeOfDay);
  const auto = useAppStore((s) => s.autoTimeOfDay);
  const setManual = useAppStore((s) => s.setManualTimeOfDay);

  return (
    <div
      className="glass-dark flex items-center gap-1 rounded-full p-1"
      role="group"
      aria-label="背景の時間帯を切り替え"
    >
      {TIME_OF_DAY_ORDER.map((tod) => {
        const selected = manual === tod;
        return (
          <button
            key={tod}
            type="button"
            onClick={() => setManual(tod)}
            aria-pressed={selected}
            title={`${TIME_OF_DAY_LABEL[tod]}に切り替え`}
            className={`rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3 ${
              selected
                ? 'bg-white/90 text-slate-900'
                : 'text-white/80 hover:bg-white/15'
            }`}
          >
            {TIME_OF_DAY_LABEL[tod]}
          </button>
        );
      })}

      {/* 自動に戻す */}
      <button
        type="button"
        onClick={() => setManual(null)}
        aria-pressed={manual === null}
        title={`自動(現在は${TIME_OF_DAY_LABEL[auto]})に戻す`}
        className={`rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3 ${
          manual === null
            ? 'bg-white/90 text-slate-900'
            : 'text-white/70 hover:bg-white/15'
        }`}
      >
        自動
      </button>
    </div>
  );
}
