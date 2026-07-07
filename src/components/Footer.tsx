// 全ページ共通のフッター。
import { Link } from 'react-router';
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
      <div className="mt-4 flex justify-center gap-4 text-xs">
        <Link to="/about" className="hover:text-white">
          自己紹介
        </Link>
        <Link to="/works" className="hover:text-white">
          作品集
        </Link>
        <Link to="/contact" className="hover:text-white">
          お問い合わせ
        </Link>
      </div>
      <p className="mt-6 text-[11px] text-white/40">
        © {year} {PROFILE.nameEn}. Built with React &amp; WebGL.
      </p>
    </footer>
  );
}
