// できること(Services)ページのコンテンツ(ダミー)。依頼獲得の要。
// ★ 依頼主が起床後に実データへ差し替える箇所。

export interface Service {
  id: string;
  title: string;
  summary: string;
  /** 具体的に頼める内容。 */
  details: string[];
}

export interface WorkStyle {
  label: string;
  value: string;
}

export const SERVICES: Service[] = [
  {
    id: 'web-frontend',
    title: 'Web フロントエンド開発',
    summary: 'モダンな SPA / 静的サイトの設計・実装。',
    details: [
      'React / Next.js / Vue によるアプリ実装',
      'デザインカンプ（Figma 等）からの高精度な UI 実装',
      'パフォーマンス最適化・Core Web Vitals 改善',
    ],
  },
  {
    id: 'interactive',
    title: 'インタラクティブ / 3D 表現',
    summary: 'WebGL・アニメーションで記憶に残る体験を。',
    details: [
      'Three.js / React Three Fiber による 3D 演出',
      'スクロール連動・マイクロインタラクション',
      'ブランドサイト・プロダクト LP の演出設計',
    ],
  },
  {
    id: 'fullstack',
    title: '小〜中規模のフルスタック開発',
    summary: 'フロントから API・DB まで一気通貫で。',
    details: [
      'Node.js / Python による API 実装',
      'Firebase / Supabase を使った素早い立ち上げ',
      '個人開発・スタートアップの MVP 構築',
    ],
  },
  {
    id: 'consulting',
    title: '技術相談・改善支援',
    summary: '既存プロダクトの健康診断とリファクタ。',
    details: [
      'コードレビュー・設計相談',
      'アクセシビリティ / SEO の改善',
      '開発環境・CI/CD の整備',
    ],
  },
];

export const WORK_STYLES: WorkStyle[] = [
  { label: '契約形態', value: '業務委託 / 準委任 / スポット' },
  { label: '稼働', value: '週2〜フルタイム相談可・リモート中心' },
  { label: '得意フェーズ', value: '0→1 の立ち上げ、1→10 の磨き込み' },
  { label: '対応時間帯', value: '日本時間（応相談）' },
];
