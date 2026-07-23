// プロダクト(Works)ページのコンテンツ。
// GitHub の公開リポジトリ(github.com/kozakikaoru)から取得した実データ。
// summary はリポジトリの説明文そのまま。note は種別・技術の淡白な補足に留め、
// 中身の機能を推測で書かない(捏造防止)。
// サムネイルは GitHub の OG 自動生成画像を仮置き(★スクリーンショットが
// 用意でき次第 imageUrl を実画像へ差し替える)。
// 実画像を用意したものはローカルアセットを import して imageUrl に渡す。
import careerAdvisorDemo from '../assets/works/career-advisor-demo.mp4';
import claudeCodeTutorialDemo from '../assets/works/claude-code-tutorial-demo.webp';
import cornerCutReversiDemo from '../assets/works/corner-cut-reversi-demo.webp';
import engineerTutorialDemo from '../assets/works/engineer-tutorial-demo.webp';
import topPageDemo from '../assets/works/top-page-demo.mp4';

export interface Work {
  id: string;
  title: string;
  /** 1行目: プロダクトの説明(リポジトリの説明文そのまま)。 */
  summary: string;
  /** 2行目: 種別・技術の淡白な補足。機能の推測は書かない。 */
  note: string;
  /** サムネイル画像。GitHub の OG 自動生成画像(仮)。 */
  imageUrl: string;
  /** サムネイルの切り出し位置(CSS object-position)。2:1 素材を 16:9 枠で
      使うため左右が切れる。未指定は 'left center'(OG のリポジトリ名を守る)。 */
  imagePos?: string;
  /** デモ動画(mp4)。指定するとサムネイルの代わりに無音・自動再生・ループの
      <video> を出す(アニメWebPより動きの圧縮が効き、高画質でも軽いため)。 */
  videoUrl?: string;
  /** GitHub Pages の公開 URL。無いものはリポジトリのみ公開。 */
  pagesUrl?: string;
  /** GitHub リポジトリ URL。 */
  repoUrl: string;
  /** 技術タグ。GitHub の言語統計 + package.json の主要フレームワークから抜き出した実データ。
      表示は SkillIcon 付きの Chip(種別ラベル「Webアプリ」等はユーザー指示で廃止)。 */
  tags: string[];
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
    tags: ['JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'corner_cut_reversi_eval',
    title: 'corner_cut_reversi_eval',
    summary: '異形オセロシミュレーター（対戦・評価値計算）',
    note: 'TypeScript製のWebアプリ。GitHub Pagesで公開中。',
    // デモGIF(2:1)をWebP化して同梱(122KB→36KB)。盤面が中央にあり左右は
    // 暗い余白なので、16:9枠では中央クロップ(切れるのは余白だけ)。
    imageUrl: cornerCutReversiDemo,
    imagePos: 'center',
    pagesUrl: 'https://kozakikaoru.github.io/corner_cut_reversi_eval/',
    repoUrl: 'https://github.com/kozakikaoru/corner_cut_reversi_eval',
    tags: ['TypeScript', 'Vite', 'CSS'],
  },
  {
    id: 'casino_simulator',
    title: 'casino_simulator',
    summary: 'ホールデムカジノ マーチンゲールシミュレーター',
    note: 'TypeScript製のWebアプリ。GitHub Pagesで公開中。',
    imageUrl: ogImage('casino_simulator'),
    pagesUrl: 'https://kozakikaoru.github.io/casino_simulator/',
    repoUrl: 'https://github.com/kozakikaoru/casino_simulator',
    tags: ['TypeScript', 'React', 'Vite', 'CSS'],
  },
  {
    id: 'engineer_tutorial',
    title: 'engineer_tutorial',
    summary: 'エンジニア1年生向け学習チュートリアル',
    note: 'ブラウザで読める学習コンテンツ。GitHub Pagesで公開中。',
    // デモGIFをアニメーションWebPに変換して同梱(1.5MB→390KB・mixed圧縮で文字くっきり)。
    imageUrl: engineerTutorialDemo,
    pagesUrl: 'https://kozakikaoru.github.io/engineer_tutorial/',
    repoUrl: 'https://github.com/kozakikaoru/engineer_tutorial',
    tags: ['JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'claude_code_tutorial',
    title: 'claude_code_tutorial',
    summary: 'Claude Codeチュートリアル',
    note: 'MDXで書かれたドキュメントサイト。GitHub Pagesで公開中。',
    // デモGIFをアニメーションWebPに変換して同梱(2.6MB→764KB・mixed圧縮)。
    imageUrl: claudeCodeTutorialDemo,
    pagesUrl: 'https://kozakikaoru.github.io/claude_code_tutorial/',
    repoUrl: 'https://github.com/kozakikaoru/claude_code_tutorial',
    tags: ['Astro', 'MDX', 'TypeScript', 'CSS'],
  },
  {
    id: 'career_advisor',
    title: 'career_advisor',
    summary: '進路提案Webアプリ',
    note: 'TypeScript製のWebアプリ。リポジトリのみ公開。',
    // ユーザー撮影の画面録画(1920×1080/30fps/音声あり)を、1280×720・無音・
    // H.264 に最適化(13MB→1.0MB)。16:9なので枠にぴったり=切り抜きなし。
    // imageUrl は video 非対応環境向けのフォールバック。
    imageUrl: ogImage('career_advisor'),
    videoUrl: careerAdvisorDemo,
    repoUrl: 'https://github.com/kozakikaoru/career_advisor',
    tags: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS'],
  },
  {
    id: 'company',
    title: 'company',
    summary: 'claude code用プラグイン',
    note: 'Claude Codeの拡張プラグイン。シェルスクリプト製。',
    imageUrl: ogImage('company'),
    repoUrl: 'https://github.com/kozakikaoru/company',
    tags: ['Shell'],
  },
  {
    id: 'kozakikaoru.github.io',
    title: 'kozakikaoru.github.io',
    summary: '個人HP(このサイト)',
    note: 'React + TypeScript + Three.js製。いま見ているサイトです。',
    // トップページの実録画(静止画の切替ではない=ユーザー指示)。ヘッドレス
    // ChromeのCDP screencastでパネルの浮遊と時間帯の実クロスフェードを収録し、
    // H.264 mp4化(1080×608・15fps・1.2倍速・約10秒ループ・1.5MB)。
    // アニメWebP(680px・1.4MB)は画質が悪くmp4へ移行(ユーザーFB)。
    // imageUrl は video 非対応環境向けのフォールバック。
    imageUrl: ogImage('kozakikaoru.github.io'),
    videoUrl: topPageDemo,

    pagesUrl: 'https://kozakikaoru.github.io/',
    repoUrl: 'https://github.com/kozakikaoru/kozakikaoru.github.io',
    tags: ['TypeScript', 'React', 'Three.js', 'Tailwind CSS', 'Vite'],
  },
];
