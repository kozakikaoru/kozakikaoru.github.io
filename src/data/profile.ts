// 自己紹介ページのコンテンツ(ダミー)。
// ★ 依頼主が起床後に実データへ差し替える箇所。文言はここで管理する。
// 顔写真: ユーザー提供の実写真を webp 最適化して同梱(自己紹介ページ avatar に表示)。
import avatarUrl from '../assets/profile/kozaki-kaoru.webp';

export interface Profile {
  name: string;
  nameEn: string;
  role: string;
  tagline: string;
  /** 顔写真の URL。null の間はプレースホルダを表示する。 */
  avatarUrl: string | null;
  bio: string[];
  /** スキル(単独ページは持たず、ここに内包)。 */
  skills: { category: string; items: string[] }[];
  /** ちょっとした人柄が伝わる項目。 */
  facts: { label: string; value: string }[];
}

export const PROFILE: Profile = {
  name: '（お名前）', // ★差し替え
  nameEn: 'Your Name',
  role: 'Web / フロントエンド エンジニア',
  tagline: '花畑にデジタルの光を。心地よい体験をつくります。',
  avatarUrl, // ユーザー提供の実写真(webp・最適化済み)。自己紹介ページの avatar に表示。
  bio: [
    // ★以下はすべてダミー文。実際の自己紹介に差し替える。
    'はじめまして。Web を中心に、フロントエンドからちょっとした裏側まで幅広くつくっているエンジニアです。',
    '「見て触れて気持ちいい」体験にこだわり、デザインと実装のあいだをなめらかにつなぐことを得意としています。',
    '個人開発から受託まで、企画・設計・実装・運用を一通り経験してきました。お気軽にご相談ください。',
  ],
  skills: [
    {
      category: 'フロントエンド',
      items: ['TypeScript', 'React', 'Next.js', 'Vue', 'Tailwind CSS', 'WebGL / Three.js'],
    },
    {
      category: 'バックエンド',
      items: ['Node.js', 'Python', 'REST / GraphQL', 'PostgreSQL', 'Firebase'],
    },
    {
      category: 'その他',
      items: ['UI / UX 設計', 'アクセシビリティ', 'CI/CD', 'AWS', 'Figma'],
    },
  ],
  facts: [
    { label: '拠点', value: '日本（リモート可）' }, // ★差し替え
    { label: '稼働', value: '業務委託・スポット相談 歓迎' },
    { label: '好きなもの', value: 'きれいなアニメーションと珈琲' },
  ],
};
