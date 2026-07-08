// 全ページ共通のフッター。
// ナビリンクはハードコードせず PANELS(3D パネル=サイトの一次ナビ)から生成し、
// パネルの追加・改名に自動追従させる。
import { Link } from 'react-router';
import { PANELS } from '../data/panels';
import { PROFILE } from '../data/profile';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 px-6 py-10 text-center text-white/70">
      <p className="text-sm">
        <span style={{ fontFamily: 'var(--font-display)' }}>
          {PROFILE.name}
        </span>
        <span className="mx-2 text-white/30">/</span>
        {PROFILE.role}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
        {PANELS.map((p) => (
          <Link key={p.id} to={p.to} className="hover:text-white">
            {p.label}
          </Link>
        ))}
      </div>
      <p className="mt-6 text-[11px] text-white/40">
        © {year} {PROFILE.nameEn}. Built with React &amp; WebGL.
      </p>
    </footer>
  );
}
