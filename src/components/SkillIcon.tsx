// スキルチップ用のアイコン(公式ブランドカラー付き)。
// ブランドロゴは simple-icons(MIT・公式パスデータ)から取り、Vite のツリーシェイクで
// 使う分だけバンドルされる。色は各ブランドの公式カラー(simple-icons の hex)。
// ただし GitHub(#181717)と Three.js(#000000)は公式色が黒でダークカード上では
// 見えないため、白(チップ文字と同じ /85)にフォールバックする。
// simple-icons に収録が無いもの(RSpec / AWS ※AWS は商標の都合で収録外)は、
// ブランドロゴではない汎用の形(フラスコ / 雲)を自前で描き、色だけ各ブランドの
// 定番色(RSpec=Ruby系の赤 / AWS=オレンジ #FF9900)に合わせる。
import {
  siAstro,
  siCss,
  siDocker,
  siGit,
  siGithub,
  siGnubash,
  siHtml5,
  siJavascript,
  siMdx,
  siMysql,
  siNextdotjs,
  siReact,
  siRuby,
  siRubyonrails,
  siSwift,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVite,
  siVuedotjs,
} from 'simple-icons';

const WHITE = 'rgba(255,255,255,0.85)';

interface IconDef {
  path: string;
  color: string;
}

/** スキル名 → パス(24x24)と表示色。 */
const ICONS: Record<string, IconDef> = {
  Ruby: { path: siRuby.path, color: `#${siRuby.hex}` },
  'Ruby on Rails': { path: siRubyonrails.path, color: `#${siRubyonrails.hex}` },
  MySQL: { path: siMysql.path, color: `#${siMysql.hex}` },
  TypeScript: { path: siTypescript.path, color: `#${siTypescript.hex}` },
  JavaScript: { path: siJavascript.path, color: `#${siJavascript.hex}` },
  React: { path: siReact.path, color: `#${siReact.hex}` },
  'Vue.js': { path: siVuedotjs.path, color: `#${siVuedotjs.hex}` },
  HTML: { path: siHtml5.path, color: `#${siHtml5.hex}` },
  CSS: { path: siCss.path, color: `#${siCss.hex}` },
  'Tailwind CSS': { path: siTailwindcss.path, color: `#${siTailwindcss.hex}` },
  'Three.js': { path: siThreedotjs.path, color: WHITE }, // 公式 #000000 は黒で沈む
  Docker: { path: siDocker.path, color: `#${siDocker.hex}` },
  Git: { path: siGit.path, color: `#${siGit.hex}` },
  GitHub: { path: siGithub.path, color: WHITE }, // 公式 #181717 は黒で沈む
  Swift: { path: siSwift.path, color: `#${siSwift.hex}` },
  Vite: { path: siVite.path, color: `#${siVite.hex}` },
  Astro: { path: siAstro.path, color: `#${siAstro.hex}` },
  MDX: { path: siMdx.path, color: WHITE }, // 公式 #1B1F24 は黒で沈む
  'Next.js': { path: siNextdotjs.path, color: WHITE }, // 公式 #000000 は黒で沈む
  Shell: { path: siGnubash.path, color: `#${siGnubash.hex}` },
  // ---- simple-icons 非収録(汎用の形・ブランドロゴではない)----
  RSpec: {
    // テストを示すフラスコ
    path: 'M10 2h4a1 1 0 0 1 0 2v4.2l4.9 8.5c.9 1.5-.2 3.3-1.9 3.3H7a2.2 2.2 0 0 1-1.9-3.3L10 8.2V4a1 1 0 0 1 0-2zm2 8.6-3.4 5.9h6.8z',
    color: '#CC342D',
  },
  AWS: {
    // クラウド(雲)
    path: 'M17.8 18.5H6.7a4.7 4.7 0 0 1-.6-9.4 6.2 6.2 0 0 1 12-1 4.6 4.6 0 0 1-.3 10.4z',
    color: '#FF9900',
  },
  Java: {
    // コーヒーカップ(Java も商標の都合で simple-icons 非収録)
    path: 'M4 9h13v6.5A5.5 5.5 0 0 1 11.5 21h-2A5.5 5.5 0 0 1 4 15.5V9zm14.5 1.5h.75a3.25 3.25 0 0 1 0 6.5h-1.06c.2-.63.31-1.3.31-2h.75a1.25 1.25 0 0 0 0-2.5h-.75v-2zM7.1 3.6c.9.9.9 1.9 0 2.8L6 7.5c-.4-1.2-.1-2.4 1.1-3.9zm3.9 0c.9.9.9 1.9 0 2.8l-1.1 1.1c-.4-1.2-.1-2.4 1.1-3.9z',
    color: '#E76F00',
  },
  基本情報技術者試験: {
    // メダル(資格の汎用アイコン)
    path: 'M12 2.5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM8.6 14.9 7 21.5l5-2.7 5 2.7-1.6-6.6a7.5 7.5 0 0 1-6.8 0z',
    color: '#EAB308',
  },
};

/**
 * スキル名に対応するアイコンを返す(見つからなければ何も描かない)。
 * 装飾なので aria-hidden。サイズはチップの文字(text-xs)に合わせた 14px。
 */
export function SkillIcon({ name }: { name: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill={icon.color}
      aria-hidden="true"
      focusable="false"
    >
      <path d={icon.path} />
    </svg>
  );
}
