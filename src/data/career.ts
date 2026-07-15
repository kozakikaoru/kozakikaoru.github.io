// 経歴(Career)ページのコンテンツ。客先に見せる想定。
// これまで対応した案件を時系列(ロードマップ/タイムライン)で見せる。
// 実データ元 = スキルシート(.company/skillsheet.md に整理)+ ユーザー直接指示。
// 守秘のため案件先の社名は伏せる。

export type ProjectStatus = 'done' | 'ongoing';

export interface CareerProject {
  id: string;
  /** 期間表示(例: '2025.04 – 2025.09')。 */
  period: string;
  /** ソート用の開始年月(YYYY-MM)。新しい順に並べる。 */
  sortKey: string;
  status: ProjectStatus;
  /** スタートアップ案件なら「スタートアップ」バッジを出す。 */
  startup?: boolean;
  /** 案件タイトル。 */
  title: string;
  /** 案件概要。任意(未設定なら非表示)。 */
  summary?: string;
  /** 具体的にやったこと(箇条書き)。 */
  highlights: string[];
  /** 使った技術(言語・フレームワーク・DB など)。 */
  stack: string[];
  /** 成果・インパクト(客先アピール)。任意(未設定なら非表示)。 */
  outcome?: string;
}

export const CAREER_PROJECTS: CareerProject[] = [
  {
    id: 'c1',
    period: '2024.07 – 現在',
    sortKey: '2024-07',
    status: 'ongoing',
    title: 'CRO プラットフォーム',
    highlights: [
      'Ruby/Rails を用いた API 開発',
      'RSpec を用いたテストコーディング',
      '旧環境から新環境へのデータ移行機能開発',
      'MySQL のバージョンアップグレード',
      'Vue を用いた管理画面の実装',
    ],
    stack: [
      'Ruby',
      'Ruby on Rails',
      'RSpec',
      'Vue.js',
      'AWS',
      'MySQL',
      'HTML',
      'CSS',
    ],
  },
  {
    id: 'c2',
    period: '2022.08 – 2024.06',
    sortKey: '2022-08',
    status: 'done',
    title: 'VR 体験アプリ',
    highlights: [
      'Ruby/Rails を用いた API コーディング',
      'RSpec を用いたテストコーディング',
      'API 設計書などのドキュメント作成',
      'VRM ファイルの解析処理作成',
      'アバター・ライセンス管理周りの実装',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'RSpec'],
  },
  {
    id: 'c3',
    period: '2022.01 – 2022.06',
    sortKey: '2022-01',
    status: 'done',
    title: 'クラウド型入退室管理システム開発',
    highlights: [
      'Ruby/Rails を用いた API コーディング',
      'Vue.js で作成された画面の保守',
      'RSpec を用いたテストコーディング',
      'API 設計書などのドキュメント作成',
      'コードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'RSpec', 'Vue.js', 'HTML', 'MySQL'],
  },
  {
    id: 'c4',
    period: '2021.06 – 2021.12',
    sortKey: '2021-06',
    status: 'done',
    title: 'クラウドファンディング SaaS 開発',
    highlights: [
      'Ruby/Rails/ERB を用いたシステム開発',
      'クレジットカード決済の 3DS2.0 導入(GMO)',
      'RSpec を用いたテストコーディング',
      '新規機能開発に伴う DB のテーブル設計',
      'コードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'RSpec', 'HTML', 'MySQL'],
  },
  {
    id: 'c5',
    period: '2020.01 – 2021.04',
    sortKey: '2020-01',
    status: 'done',
    title: '自動車フリマアプリ開発',
    highlights: [
      'Ruby/Rails を用いた API 開発',
      'RSpec を用いたテストコーディング',
      '新規機能開発に伴う DB のテーブル設計',
      'API 仕様書・結合テスト仕様書などのドキュメント作成',
      '新規参画者への Ruby/Rails コーディング指導・モブプログラミング',
      'コードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'RSpec', 'JavaScript', 'CSS', 'MySQL'],
  },
  {
    id: 'c6',
    period: '2018.10 – 2019.06',
    sortKey: '2018-10',
    status: 'done',
    startup: true,
    title: 'Windows 向け RPA 開発',
    highlights: [
      'Ruby/Rails を用いた API 開発',
      'RSpec を用いたテストコーディング',
      'オンライン決済機能の実装',
      'API 仕様書・画面仕様書などのドキュメント作成',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'RSpec', 'JavaScript', 'CSS', 'MySQL'],
  },
  {
    id: 'c7',
    period: '2017.07 – 2018.08',
    sortKey: '2017-07',
    status: 'done',
    startup: true,
    title: '給食管理システム',
    highlights: [
      'Ruby/Rails/ERB を用いた業務システム開発',
      '仕入れ・調理指示・配送などの機能を内包した在庫管理システム',
      '要件整理からデータベース設計をゼロベースで担当',
      '他プログラマー 2 名のコードレビュー',
      '画面仕様書・テスト仕様書などのドキュメント作成',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'HTML', 'CSS', 'JavaScript', 'MySQL'],
  },
  {
    id: 'c8',
    period: '2016.09 – 2017.05',
    sortKey: '2016-09',
    status: 'done',
    startup: true,
    title: 'レシートクーポン管理アプリ',
    highlights: [
      'Ruby/Rails/ERB を用いた管理画面実装',
      '各種バッチタスク(ランキング集計など)の実装',
      'Android・iOS の WebView アプリ開発・ストア申請',
      'PO・デザイナーからの要求分析',
      '運用マニュアル・テスト仕様書などのドキュメント作成',
    ],
    stack: [
      'Ruby',
      'Ruby on Rails',
      'JavaScript',
      'HTML',
      'CSS',
      'Java',
      'Swift',
      'MySQL',
    ],
  },
];
