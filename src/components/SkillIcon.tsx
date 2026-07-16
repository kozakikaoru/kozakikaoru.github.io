// スキルチップ用のアイコン。
// ブランドロゴは simple-icons(MIT・公式パスデータ)から取り、Vite のツリーシェイクで
// 使う分だけバンドルされる。simple-icons に収録が無いもの(RSpec / AWS ※AWS は商標の
// 都合で収録外)は、ブランドロゴではない汎用の形(フラスコ / 雲)を自前で描く。
// 色は currentColor = チップの文字色に追従(モノクロで統一し、チップの賑やかさを抑える)。
import {
  siCss,
  siDocker,
  siGit,
  siGithub,
  siHtml5,
  siJavascript,
  siMysql,
  siReact,
  siRuby,
  siRubyonrails,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVuedotjs,
} from 'simple-icons';

/** スキル名 → simple-icons のパス(24x24)。 */
const BRAND_PATHS: Record<string, string> = {
  Ruby: siRuby.path,
  'Ruby on Rails': siRubyonrails.path,
  MySQL: siMysql.path,
  TypeScript: siTypescript.path,
  JavaScript: siJavascript.path,
  React: siReact.path,
  'Vue.js': siVuedotjs.path,
  HTML: siHtml5.path,
  CSS: siCss.path,
  'Tailwind CSS': siTailwindcss.path,
  'Three.js': siThreedotjs.path,
  Docker: siDocker.path,
  Git: siGit.path,
  GitHub: siGithub.path,
};

/** simple-icons に無いスキルの汎用アイコン(24x24・ブランドロゴではない)。 */
const GENERIC_PATHS: Record<string, string> = {
  // RSpec: テストを示すフラスコ
  RSpec:
    'M10 2h4a1 1 0 0 1 0 2v4.2l4.9 8.5c.9 1.5-.2 3.3-1.9 3.3H7a2.2 2.2 0 0 1-1.9-3.3L10 8.2V4a1 1 0 0 1 0-2zm2 8.6-3.4 5.9h6.8z',
  // AWS: クラウド(雲)
  AWS: 'M17.8 18.5H6.7a4.7 4.7 0 0 1-.6-9.4 6.2 6.2 0 0 1 12-1 4.6 4.6 0 0 1-.3 10.4z',
};

/**
 * スキル名に対応するアイコンを返す(見つからなければ何も描かない)。
 * 装飾なので aria-hidden。サイズはチップの文字(text-xs)に合わせた 14px。
 */
export function SkillIcon({ name }: { name: string }) {
  const d = BRAND_PATHS[name] ?? GENERIC_PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
