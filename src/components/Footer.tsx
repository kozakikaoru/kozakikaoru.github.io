// 下層ページのフッター(TOP は全画面ヒーローなので App の FooterSlot が出し分ける)。
// ユーザー指示で著作権表記1行のみ。区切り線なし・余白は詰める。
// 背景写真の上に直接載るため、文字は白 + 濃い黒影(text-hud-shadow)で読ませる。
import { PROFILE } from '../data/profile';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-hud-shadow relative z-10 mt-12 px-6 py-6 text-center text-[11px] text-white/75">
      © {year} {PROFILE.nameEn}
    </footer>
  );
}
