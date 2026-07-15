// 下層ページのフッター(TOP は全画面ヒーローなので App の FooterSlot が出し分ける)。
// ナビリンクはハードコードせず PANELS(3D パネル=サイトの一次ナビ)から生成し、
// パネルの追加・改名に自動追従させる。
// 背景写真の上に直接載るため、文字は白 + 濃い黒影(text-hud-shadow)で読ませる。
import { Link } from 'react-router';
import { PANELS } from '../data/panels';
import { PROFILE } from '../data/profile';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-hud-shadow relative z-10 mt-24 border-t border-white/10 px-6 py-10 text-center text-white/75">
      <p className="text-sm">
        <span style={{ fontFamily: 'var(--font-display)' }}>
          {PROFILE.name}
        </span>
        <span className="mx-2 text-white/40">/</span>
        {PROFILE.role}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {PANELS.map((p) => (
          // hover は不透明度で出す。文字色は index.css の a{color:inherit} が
          // レイヤー外にあり @layer utilities の hover:text-* に勝つため効かない(Nav と同じ対策)。
          <Link
            key={p.id}
            to={p.to}
            className="transition-opacity hover:opacity-80"
          >
            {p.label}
          </Link>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-white/75">
        © {year} {PROFILE.nameEn}. Built with React &amp; WebGL.
      </p>
    </footer>
  );
}
