// 経歴(Career)ページのコンテンツ(ダミー)。客先に見せる想定。
// これまで対応した案件を時系列(ロードマップ/タイムライン)で見せる。
// ★ 依頼主が起床後に実案件へ差し替える箇所。守秘のため社名等はぼかす想定。

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
  /** 案件概要。 */
  summary: string;
  /** 具体的にやったこと(箇条書き)。 */
  highlights: string[];
  /** 使った技術。 */
  stack: string[];
  /** 成果・インパクト(客先アピール)。 */
  outcome: string;
}

// domain ごとのアクセント色。タイムラインのノード/バッジに使う。
// ネオン系パレット(panels.ts の accent 系統)から、ページアクセント(#ff9e2c)と
// 被らないよう割り当てる。旧パステル(#7bb661 等)は全廃。
export const DOMAIN_COLORS: Record<string, string> = {
  'Web 制作': '#05d9e8',
  '自社プロダクト': '#b14dff',
  '受託開発': '#ff5566',
  'R&D / 実験': '#1f8fff',
  デフォルト: '#7ff3ff',
};

export const CAREER_PROJECTS: CareerProject[] = [
  {
    id: 'c1',
    period: '2025.10 – 現在',
    sortKey: '2025-10',
    status: 'ongoing',
    title: '大規模 Web サービスの 3D 演出リード', // ★差し替え
    role: 'フロントエンド / インタラクション担当',
    domain: '受託開発',
    summary:
      'ブランドサイトの 3D 体験パートを設計・実装。パフォーマンスと表現力の両立を主導。',
    highlights: [
      'React Three Fiber による 3D シーン設計',
      'モバイル向けの軽量フォールバック実装',
      'デザイナーと協働した演出プロトタイピング',
    ],
    stack: ['React', 'Three.js', 'TypeScript', 'GSAP'],
    outcome: '公開後の平均滞在時間が改善し、SNS でのシェアが増加。',
  },
  {
    id: 'c2',
    period: '2025.04 – 2025.09',
    sortKey: '2025-04',
    status: 'done',
    title: 'SaaS 管理画面のリニューアル',
    role: 'テックリード',
    domain: '自社プロダクト',
    summary:
      'レガシー化した管理画面を段階的に刷新。コンポーネント基盤とデザインシステムを整備。',
    highlights: [
      'デザインシステムの構築と移行計画の策定',
      'アクセシビリティ(WCAG AA)対応',
      '表示パフォーマンスの大幅改善',
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Storybook'],
    outcome: '初期表示速度を約 40% 改善し、サポート問い合わせを削減。',
  },
  {
    id: 'c3',
    period: '2024.08 – 2025.03',
    sortKey: '2024-08',
    status: 'done',
    title: 'EC サイトのフロントエンド開発',
    role: 'フロントエンドエンジニア',
    domain: '受託開発',
    summary:
      'モバイルファーストの EC フロントを新規構築。購買導線の最適化に注力。',
    highlights: [
      'デザインカンプからの高精度な実装',
      'カート・決済フローの UX 改善',
      'A/B テスト基盤の導入',
    ],
    stack: ['React', 'Redux', 'Firebase'],
    outcome: 'モバイルの CVR が向上し、離脱率が低下。',
  },
  {
    id: 'c4',
    period: '2024.01 – 2024.07',
    sortKey: '2024-01',
    status: 'done',
    title: 'コーポレートサイト制作(複数社)',
    role: 'Web エンジニア',
    domain: 'Web 制作',
    summary:
      '複数のコーポレートサイトを企画・制作。表示速度と保守性を重視した構成。',
    highlights: [
      '静的サイトジェネレータによる高速サイト構築',
      'CMS 連携で運用しやすい構成に',
      'SEO・構造化データ対応',
    ],
    stack: ['Astro', 'Tailwind CSS', 'microCMS'],
    outcome: '各サイトで検索流入と問い合わせ数が増加。',
  },
  {
    id: 'c5',
    period: '2023.01 – 2023.12',
    sortKey: '2023-01',
    status: 'done',
    title: '個人開発 & 技術検証',
    role: '個人開発',
    domain: 'R&D / 実験',
    summary:
      'Web 表現の幅を広げるための個人開発と技術検証を継続。',
    highlights: [
      'WebGL / Canvas 表現の実験',
      'OSS への貢献',
      '技術記事の執筆・発信',
    ],
    stack: ['Vue', 'WebGL', 'D3.js'],
    outcome: '得られた知見を実務の演出・パフォーマンス改善に還元。',
  },
];
