// プロフィールページのコンテンツ。文言はここで管理する。
// 名前は 3D パネル(panels.ts の displayLabel)にも掲載済みの公開情報。
// bio / tagline / facts は★本人の言葉が届くまでの仮文。嘘にならない範囲の
// 汎用的な内容(Web 中心・React/TypeScript 好き・AI とのものづくり)に留め、
// 具体的な社名・実績・稼働条件などは書かない。
// 顔写真: ユーザー提供の実写真を webp 最適化して同梱(プロフィールページ avatar に表示)。
import avatarUrl from '../assets/profile/kozaki-kaoru.webp';

export interface Profile {
  name: string;
  nameEn: string;
  role: string;
  tagline: string;
  /** 顔写真の URL。null の間はプレースホルダを表示する。 */
  avatarUrl: string | null;
  bio: string[];
  /** SNS・外部アカウント(プロフィールカードの下部にリンク表示)。 */
  socials: { label: string; handle: string; url: string }[];
  /** スキル(単独ページは持たず、ここに内包)。 */
  skills: { category: string; items: string[] }[];
  /** ちょっとした人柄が伝わる項目。 */
  facts: { label: string; value: string }[];
}

export const PROFILE: Profile = {
  name: '小崎 薫',
  nameEn: 'KOZAKI KAORU',
  role: 'Web / フロントエンド エンジニア',
  // ★仮のキャッチコピー。本人の言葉に差し替え可。
  tagline: 'Webを中心に、つくって公開するのが好きなエンジニアです。',
  avatarUrl, // ユーザー提供の実写真(webp・最適化済み)。プロフィールページの avatar に表示。
  // 配列の各要素が1段落(段落間は space-y-4 の余白)。段落内の改行(\n)は
  // 句点ごとの改行として About.tsx 側で whitespace-pre-line 表示する。
  // 表記ルール(英字と日本語の間に半角スペースを入れない)を適用済み
  //   ※原文の「長いこと Ruby / Rails 一本」→「長いことRuby / Rails一本」(英字どうしの / 前後は維持)。
  bio: [
    'はじめまして小崎です。',
    `長いことRuby / Rails一本でバックエンドの開発に携わってきました。
AIのおかげで技術の垣根がだいぶ低くなったので、現在はフルスタックを目指して頑張ってます。`,
    `AIの分野全般に興味があり、趣味の範囲でイラストや音楽なども制作しています。
3Dも覚えたくて、この個人サイトではThree.jsを使用してみました。`,
    `制作したものはGitHubで公開してます。
気になるものがあれば、お気軽にご連絡ください。`,
    '最近はAI遊びばかりしていますが、技術以外ではドライブ・ゲームなどが趣味です。',
    `車が好きで一生運転できるので、休日は愛車のJeep Compassを乗り回してます。
車好きと言うとスポーツカーの話を振られますが、そっちは専門外です。頭文字Dは履修済み。`,
    `ゲームもマイナーなモバイルゲームに没頭しちゃうタイプで、世間で流行っているゲームは全然やっていません。
そんな私の人生で1番すきなゲームはGBAの「マジカルバケーション」。`,
  ],
  socials: [
    { label: 'GitHub', handle: 'kozakikaoru', url: 'https://github.com/kozakikaoru' },
    { label: 'X', handle: '@kaoruby_', url: 'https://x.com/kaoruby_' },
  ],
  skills: [
    // スキルシート(.company/skillsheet.md=職務経歴)と GitHub の公開リポジトリから整理。
    // バックエンド = 本業の中心(全案件 Ruby/Rails)。フロントエンドは案件(Vue)+
    // 個人開発(React/TS/Tailwind/Three.js=このサイト等)。各項目は SkillIcon にアイコンあり。
    {
      category: 'バックエンド',
      items: ['Ruby', 'Ruby on Rails', 'RSpec'],
    },
    {
      category: 'フロントエンド',
      items: [
        'TypeScript',
        'JavaScript',
        'React',
        'Vue.js',
        'HTML',
        'CSS',
        'Tailwind CSS',
        'Three.js',
      ],
    },
    {
      category: 'ツール・インフラ',
      items: ['AWS', 'MySQL', 'Docker', 'Git', 'GitHub'],
    },
    {
      category: '資格',
      items: ['基本情報技術者試験'],
    },
  ],
  facts: [
    { label: '拠点', value: '福岡県' },
    { label: '生年月日', value: '1995年12月3日' },
  ],
};
