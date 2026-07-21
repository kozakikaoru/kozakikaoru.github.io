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
  bio: [
    // ★仮のプロフィール文。本人確認後に差し替える(実績・所属などの具体は書かない)。
    'Webを中心にものづくりをしているエンジニアです。ReactやTypeScriptが好きで、小さなアプリやツールをつくっては公開しています。',
    '最近はAIを使ったものづくりを楽しんでいます。このサイトも、掲載している楽曲も、AIとの共同制作です。',
    'つくったものはGitHubで公開しています。気になるものがあれば、お気軽にご連絡ください。',
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
