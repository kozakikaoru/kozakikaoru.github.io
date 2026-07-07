// 時間帯の定義と、端末時刻からの判定ロジック。
// 朝 5:00〜9:59 / 昼 10:00〜16:59 / 夕方 17:00〜18:59 / 夜 19:00〜翌4:59
// (ユーザーが背景を4分割したのに合わせ、従来の3区分に「朝」を追加。)

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export const TIME_OF_DAY_ORDER: TimeOfDay[] = [
  'morning',
  'day',
  'evening',
  'night',
];

export const TIME_OF_DAY_LABEL: Record<TimeOfDay, string> = {
  morning: '朝',
  day: '昼',
  evening: '夕方',
  night: '夜',
};

/** 指定した時刻(時, 0-23)がどの時間帯かを返す。 */
export function timeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour <= 9) return 'morning';
  if (hour >= 10 && hour <= 16) return 'day';
  if (hour >= 17 && hour <= 18) return 'evening';
  return 'night'; // 19:00〜23:59 と 0:00〜4:59
}

/** 現在の端末時刻から時間帯を判定する。 */
export function currentTimeOfDay(now: Date = new Date()): TimeOfDay {
  return timeOfDayFromHour(now.getHours());
}
