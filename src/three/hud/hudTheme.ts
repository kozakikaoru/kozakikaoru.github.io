// パネル別 HUD テーマ(装飾カタログ 9)。
// 各パネルの「内容」に合わせて、リードアウト群(疑似データ)・ステータスタグ・
// キャプション・アイコン種別・数値スケールを 1 箇所に集約する。
// GlassPanel はこのテーマを読んで、テクスチャ(発光/淡)とジオメトリを構成する。
//
// 重要な設計方針:
//   - ここで扱う文字列は全て ASCII(英数字・記号)のみ。ドットマトリクス(5×7)フォントで
//     描くため日本語・絵文字は不可。あくまで "計器の見た目" を作る装飾(SR 対象外)。
//   - パネル中央の大きな日本語ラベル(「小崎 薫」等)は panels.ts の displayLabel に持ち、
//     canvas 2D fillText(システムフォント)で発光テクスチャ化して描く(hudTextures.makeLabelTexture)。
//     こちらも装飾(発光層)扱いで SR 非対象。読み上げは DOM ナビの label が担保する。
//   - 疑似データは各パネルの主題に沿った語彙にする(散らかさず、意図的な作り込みに)。

/** アイコン種別(hudGeometry.makeIconGeometry が解釈する)。 */
export type HudIconKind =
  | 'profile'
  | 'music'
  | 'gallery'
  | 'route'
  | 'signal';

/** ミニチャートの種類(発光テクスチャで描くリードアウト)。 */
export type HudChartKind =
  | 'bars' // 縦バーメーター(イコライザ風)
  | 'wave' // 折れ線波形
  | 'grid' // 作品グリッド(小さな四角の集合)
  | 'path' // 経路(座標を結ぶ折れ線 + ノード)
  | 'signal'; // シグナルバー(右肩上がりの階段バー)

export interface HudTheme {
  /** パネル種別アイコン。 */
  icon: HudIconKind;
  /** リング外周に添える 3〜4 文字の系統コード(計器の型番風)。 */
  seriesCode: string;
  /** リング下の主キャプション(モノスペース調・単位付き等)。 */
  caption: string;
  /** 右上の副情報(座標/バージョン風の 1 行)。 */
  subReadout: string;
  /** 発光ステータスタグ(短く・大文字)。"ONLINE" 等。 */
  statusTag: string;
  /** ミニチャートの種類。 */
  chart: HudChartKind;
  /**
   * 進捗/メーターの基準値(0..1)。バーの充填率・ゲージ角度などに使う。
   * "作り込み" として、パネルごとに違う見え方の値にする(意味は装飾的)。
   */
  gauge: number;
  /** 目盛りに添える数値ラベル(左→右の少数個。計器感)。 */
  scaleLabels: string[];
  /** 16 進ダンプ風の短い文字列(淡ディテール層に敷く)。 */
  hexRows: string[];
  /** 単位ラベル(チャート脇)。 */
  unit: string;
}

/** パネル id → テーマ。PANELS の id と一致させること。 */
export const HUD_THEMES: Record<string, HudTheme> = {
  about: {
    icon: 'profile',
    seriesCode: 'PRF',
    // ユーザーFBで入替: 名前の下(キャプション)= KOZAKI KAORU / 右上のタグ = PROFILE。
    // ユーザーFB: 「// ID-01」等の接尾は経歴以外は削除。
    caption: 'KOZAKI KAORU',
    subReadout: 'LAT 35.68 LON 139.76',
    statusTag: 'PROFILE',
    chart: 'wave',
    gauge: 0.82,
    scaleLabels: ['00', '25', '50', '75', 'MAX'],
    hexRows: ['4F 62 1A 09 FF', 'A3 7C 55 10 2E', '0B 1A 2A 6E D4'],
    unit: 'REL',
  },
  music: {
    icon: 'music',
    seriesCode: 'SND',
    caption: 'SOUND // AI',
    subReadout: 'BPM 124',
    statusTag: 'ON AIR',
    chart: 'bars', // 縦バー=イコライザ風(音楽にそのまま合う)
    gauge: 0.74,
    scaleLabels: ['20', '200', '1K', '5K', '20K'], // 周波数帯
    hexRows: ['TRK 03', 'BPM 124', 'MIX 88'],
    unit: 'dB',
  },
  works: {
    icon: 'gallery',
    seriesCode: 'DEV',
    caption: 'DEV WORKS',
    subReadout: 'IDX 001-008',
    statusTag: 'LOADED',
    chart: 'grid',
    gauge: 0.66,
    scaleLabels: ['A', 'B', 'C', 'D', 'E'],
    hexRows: ['APP 08', 'WEB 06', 'LAB 02'],
    unit: 'PCS',
  },
  career: {
    icon: 'route',
    seriesCode: 'MAP',
    // 実データ: キャリア起点年を 2016 に(ROADMAP キャプションの年号)。
    caption: 'ROADMAP // 2016+',
    subReadout: 'NODE 07 / 07',
    statusTag: 'TRACED',
    chart: 'path',
    gauge: 0.9,
    scaleLabels: ['19', '21', '23', '25', '26'],
    hexRows: ['SEG 07', 'KM 128', 'ETA 00'],
    unit: 'YR',
  },
  contact: {
    icon: 'signal',
    seriesCode: 'SIG',
    caption: 'CONTACT',
    subReadout: 'TX READY',
    // 実データ: SIGNAL → CONTACT。ASCII のみ(ドットマトリクス描画)。
    statusTag: 'CONTACT',
    chart: 'signal',
    gauge: 0.95,
    scaleLabels: ['-9', '-6', '-3', '0', 'dB'],
    hexRows: ['CH 05', 'PWR 95', 'SNR 42'],
    unit: 'dB',
  },
};

/** 未知 id 用のフォールバック(通常は使われない)。 */
export const FALLBACK_THEME: HudTheme = HUD_THEMES.about;

export function themeFor(id: string): HudTheme {
  return HUD_THEMES[id] ?? FALLBACK_THEME;
}
