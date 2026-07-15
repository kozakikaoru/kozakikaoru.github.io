// プロダクト(Works)ページのコンテンツ。
// GitHub の公開リポジトリ(github.com/kozakikaoru)から取得した実データ。
// summary はリポジトリの説明文そのまま。note は種別・技術の淡白な補足に留め、
// 中身の機能を推測で書かない(捏造防止)。
// サムネイルは GitHub の OG 自動生成画像を仮置き(★スクリーンショットが
// 用意でき次第 imageUrl を実画像へ差し替える)。

export interface Work {
  id: string;
  title: string;
  /** 1行目: プロダクトの説明(リポジトリの説明文そのまま)。 */
  summary: string;
  /** 2行目: 種別・技術の淡白な補足。機能の推測は書かない。 */
  note: string;
  /** サムネイル画像。GitHub の OG 自動生成画像(仮)。 */
  imageUrl: string;
  /** GitHub Pages の公開 URL。無いものはリポジトリのみ公開。 */
  pagesUrl?: string;
  /** GitHub リポジトリ URL。 */
  repoUrl: string;
  /** [言語, 種別] のタグ。言語は MonoTag(英数)、種別は Chip(和文)で表示。 */
  tags: [string, string];
}

/** GitHub の OG 自動生成画像 URL(1200×600)。 */
function ogImage(repo: string): string {
  return `https://opengraph.githubassets.com/1/kozakikaoru/${repo}`;
}

export const WORKS: Work[] = [
  {
    id: 'anthos',
    title: 'anthos',
    summary: '書いた文章が一輪の花になる日記アプリ',
    note: 'ブラウザで動くWebアプリ。GitHub Pagesで公開中。',
    imageUrl: ogImage('anthos'),
    pagesUrl: 'https://kozakikaoru.github.io/anthos/',
    repoUrl: 'https://github.com/kozakikaoru/anthos',
    tags: ['JavaScript', 'Webアプリ'],
  },
  {
    id: 'corner_cut_reversi_eval',
    title: 'corner_cut_reversi_eval',
    summary: '異形オセロシミュレーター（対戦・評価値計算）',
    note: 'TypeScript製のWebアプリ。GitHub Pagesで公開中。',
    imageUrl: ogImage('corner_cut_reversi_eval'),
    pagesUrl: 'https://kozakikaoru.github.io/corner_cut_reversi_eval/',
    repoUrl: 'https://github.com/kozakikaoru/corner_cut_reversi_eval',
    tags: ['TypeScript', 'シミュレーター'],
  },
  {
    id: 'casino_simulator',
    title: 'casino_simulator',
    summary: 'ホールデムカジノ マーチンゲールシミュレーター',
    note: 'TypeScript製のWebアプリ。GitHub Pagesで公開中。',
    imageUrl: ogImage('casino_simulator'),
    pagesUrl: 'https://kozakikaoru.github.io/casino_simulator/',
    repoUrl: 'https://github.com/kozakikaoru/casino_simulator',
    tags: ['TypeScript', 'シミュレーター'],
  },
  {
    id: 'engineer_tutorial',
    title: 'engineer_tutorial',
    summary: 'エンジニア1年生向け学習チュートリアル',
    note: 'ブラウザで読める学習コンテンツ。GitHub Pagesで公開中。',
    imageUrl: ogImage('engineer_tutorial'),
    pagesUrl: 'https://kozakikaoru.github.io/engineer_tutorial/',
    repoUrl: 'https://github.com/kozakikaoru/engineer_tutorial',
    tags: ['JavaScript', 'チュートリアル'],
  },
  {
    id: 'claude_code_tutorial',
    title: 'claude_code_tutorial',
    summary: 'Claude Codeチュートリアル',
    note: 'MDXで書かれたドキュメントサイト。GitHub Pagesで公開中。',
    imageUrl: ogImage('claude_code_tutorial'),
    pagesUrl: 'https://kozakikaoru.github.io/claude_code_tutorial/',
    repoUrl: 'https://github.com/kozakikaoru/claude_code_tutorial',
    tags: ['MDX', 'チュートリアル'],
  },
  {
    id: 'career_advisor',
    title: 'career_advisor',
    summary: '進路提案Webアプリ',
    note: 'TypeScript製のWebアプリ。リポジトリのみ公開。',
    imageUrl: ogImage('career_advisor'),
    repoUrl: 'https://github.com/kozakikaoru/career_advisor',
    tags: ['TypeScript', 'Webアプリ'],
  },
  {
    id: 'company',
    title: 'company',
    summary: 'claude code用プラグイン',
    note: 'Claude Codeの拡張プラグイン。シェルスクリプト製。',
    imageUrl: ogImage('company'),
    repoUrl: 'https://github.com/kozakikaoru/company',
    tags: ['Shell', 'プラグイン'],
  },
  {
    id: 'kozakikaoru.github.io',
    title: 'kozakikaoru.github.io',
    summary: '個人HP(このサイト)',
    note: 'React + TypeScript + Three.js製。いま見ているサイトです。',
    imageUrl: ogImage('kozakikaoru.github.io'),
    pagesUrl: 'https://kozakikaoru.github.io/',
    repoUrl: 'https://github.com/kozakikaoru/kozakikaoru.github.io',
    tags: ['TypeScript', 'Webサイト'],
  },
];
