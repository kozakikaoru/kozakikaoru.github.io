// 経歴(Career)ページのコンテンツ。客先に見せる想定。
// これまで対応した案件を時系列(ロードマップ/タイムライン)で見せる。
// 実データ元 = スキルシート(.company/skillsheet.md に整理)。守秘のため案件先社名は伏せる。
// summary(概要)/ outcome(成果コメント)は任意。付けたい案件だけ後から個別に追記する。

export type ProjectStatus = 'done' | 'ongoing';

export interface CareerProject {
  id: string;
  /** 期間表示(例: '2025.04 – 2025.09')。 */
  period: string;
  /** ソート用の開始年月(YYYY-MM)。新しい順に並べる。 */
  sortKey: string;
  status: ProjectStatus;
  /** 案件タイトル。 */
  title: string;
  /** 立場・役割。 */
  role: string;
  /** 案件のジャンル(タイムラインの色分けに使う)。 */
  domain: string;
  /** 案件概要。任意(未設定なら非表示)。 */
  summary?: string;
  /** 具体的にやったこと(箇条書き)。 */
  highlights: string[];
  /** 使った技術(言語・フレームワーク・DB)。 */
  stack: string[];
  /** 成果・インパクト(客先アピール)。任意(未設定なら非表示)。 */
  outcome?: string;
}

// domain ごとのアクセント色。タイムラインのノード/バッジに使う。
// ネオン系パレット(panels.ts の accent 系統)から、ページアクセント(#ff9e2c)と
// 被らないよう割り当てる。
export const DOMAIN_COLORS: Record<string, string> = {
  SaaS: '#b14dff',
  'Web サービス': '#05d9e8',
  業務システム: '#1f8fff',
  モバイルアプリ: '#ff5566',
  デフォルト: '#7ff3ff',
};

export const CAREER_PROJECTS: CareerProject[] = [
  {
    id: 'c1',
    period: '2022.01 – 現在',
    sortKey: '2022-01',
    status: 'ongoing',
    title: 'クラウド型入退室管理システム開発',
    role: 'プログラマー',
    domain: 'SaaS',
    highlights: [
      'Ruby/Rails を用いた API コーディング',
      'Vue.js で作成された画面の保守',
      'RSpec を用いたテストコーディング',
      'API 設計書などのドキュメント作成',
      'コードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'Vue.js', 'HTML', 'MySQL'],
  },
  {
    id: 'c2',
    period: '2021.06 – 2021.12',
    sortKey: '2021-06',
    status: 'done',
    title: 'クラウドファンディング SaaS 開発',
    role: 'プログラマー',
    domain: 'SaaS',
    highlights: [
      'Ruby/Rails/ERB を用いたコーディング',
      'クレジットカード決済の 3DS2.0 導入(GMO)',
      'RSpec を用いたテストコーディング',
      '新規機能開発に伴う DB のテーブル設計',
      'テスト仕様書などのドキュメント作成',
      'コードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'HTML', 'MySQL'],
  },
  {
    id: 'c3',
    period: '2020.01 – 2021.04',
    sortKey: '2020-01',
    status: 'done',
    title: '自動車フリマアプリ開発',
    role: 'プログラマー',
    domain: 'Web サービス',
    highlights: [
      'Ruby/Rails を用いた API コーディング',
      'RSpec を用いたテストコーディング',
      '新規機能開発に伴う DB のテーブル設計',
      'IF 仕様書・結合テスト仕様書などのドキュメント作成',
      '新規参画者への Ruby/Rails コーディング指導',
      'API ソースのコードレビュー',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'JavaScript', 'CSS', 'MySQL'],
  },
  {
    id: 'c4',
    period: '2018.10 – 2019.06',
    sortKey: '2018-10',
    status: 'done',
    title: 'Windows 向け RPA 開発',
    role: 'プログラマー',
    domain: '業務システム',
    highlights: [
      'Ruby/Rails を用いた API ソースコーディング',
      'RSpec を用いたテストコーディング',
      'オンライン決済機能の実装',
      'IF 仕様書・画面などのドキュメント作成',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'JavaScript', 'CSS', 'MySQL'],
  },
  {
    id: 'c5',
    period: '2017.07 – 2018.08',
    sortKey: '2017-07',
    status: 'done',
    title: '給食管理システム',
    role: 'プログラマー',
    domain: '業務システム',
    highlights: [
      'Ruby/Rails/ERB を用いたコーディング',
      '他プログラマー 2 名のコードレビュー',
      '画面仕様書・テスト仕様書などのドキュメント作成',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'HTML', 'CSS', 'JavaScript', 'MySQL'],
  },
  {
    id: 'c6',
    period: '2016.09 – 2017.05',
    sortKey: '2016-09',
    status: 'done',
    title: 'レシートクーポン管理アプリ',
    role: 'プログラマー',
    domain: 'モバイルアプリ',
    highlights: [
      'Ruby/Rails/ERB を用いた管理画面コーディング',
      '各種バッチタスク(ランキング集計など)の作成',
      'Android・iOS のバグ修正',
      'PO・デザイナーからの要求分析',
      '運用マニュアル・テスト仕様書などのドキュメント作成',
    ],
    stack: ['Ruby', 'Ruby on Rails', 'JavaScript', 'HTML', 'CSS', 'Java', 'Swift', 'MySQL'],
  },
];
