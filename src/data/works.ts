// 作品集(Works)ページのコンテンツ(ダミー)。
// ★ 依頼主が起床後に実データ・実画像へ差し替える箇所。
// thumbnailUrl が null の間は世界観に合ったグラデーションのプレースホルダを表示する。

export interface Work {
  id: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  tags: string[];
  /** サムネイル画像 URL。null ならプレースホルダ。 */
  thumbnailUrl: string | null;
  /** 外部リンク(公開 URL や GitHub 等)。null なら非表示。 */
  link: string | null;
  /** プレースホルダ用のアクセント色(2色グラデーション)。 */
  gradient: [string, string];
}

export const WORKS: Work[] = [
  {
    id: 'w1',
    title: 'インタラクティブ・ブランドサイト', // ★差し替え
    category: 'Web / 3D',
    year: '2025',
    summary:
      'WebGL を使った没入型のブランドサイト。スクロールに連動した 3D 演出でプロダクトの世界観を表現。',
    tags: ['Three.js', 'React', 'GSAP'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#4dd0e1', '#7bb661'],
  },
  {
    id: 'w2',
    title: 'SaaS 管理ダッシュボード',
    category: 'Web アプリ',
    year: '2024',
    summary:
      '大量データを扱う管理画面。パフォーマンスとアクセシビリティを両立した UI コンポーネント群を設計。',
    tags: ['Next.js', 'TypeScript', 'Recharts'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#e879f9', '#8ecae6'],
  },
  {
    id: 'w3',
    title: 'モバイル EC アプリ',
    category: 'フロントエンド',
    year: '2024',
    summary:
      '快適な購買体験を目指した EC フロント。マイクロインタラクションで「気持ちよさ」を追求。',
    tags: ['React Native', 'Firebase'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#f4a261', '#e879f9'],
  },
  {
    id: 'w4',
    title: '個人開発ツール',
    category: '個人開発',
    year: '2023',
    summary:
      '日々の作業を効率化する Web ツール。企画から実装・運用まで一人で担当。',
    tags: ['Vue', 'Supabase'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#7bb661', '#a5f3fc'],
  },
  {
    id: 'w5',
    title: 'コーポレートサイト リニューアル',
    category: 'Web 制作',
    year: '2023',
    summary:
      '既存サイトの全面刷新。表示速度と SEO を大幅に改善し、問い合わせ数の向上に貢献。',
    tags: ['Astro', 'Tailwind CSS'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#8ecae6', '#4dd0e1'],
  },
  {
    id: 'w6',
    title: 'データ可視化 実験',
    category: '実験 / R&D',
    year: '2022',
    summary:
      'Canvas / WebGL を使ったデータビジュアライゼーションの習作。表現の引き出しを増やすための実験。',
    tags: ['D3.js', 'WebGL'],
    thumbnailUrl: null,
    link: null,
    gradient: ['#a5f3fc', '#e879f9'],
  },
];
