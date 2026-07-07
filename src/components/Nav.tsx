// 全ページ共通のヘッダーナビゲーション。
// PC(md+): サイト名を画面左端・ページリンクを中央・時間帯スイッチャーを画面右端に配置。
// スマホ(md 未満): サイト名 + ハンバーガー(ページリンク + 時間帯スイッチャーを格納)。
// 背景(朝の明るい空〜夜)に依らず読めるよう、上部に暗いスクリム(グラデ)を敷く。
import { useState } from 'react';
import { NavLink, Link } from 'react-router';
import { PANELS } from '../data/panels';
import { TimeSwitcher } from './TimeSwitcher';

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // ページリンク = 素のテキストリンク。現在ページは発光色で示す。可読性のため text-glow を添える。
  // 素のテキストリンク。色は index.css の a{color:inherit}(レイヤー外で色ユーティリティに勝つ)
  // に負けないよう、className ではなく style で直接指定する(白/現在ページは発光色)。
  const deskLinkClass =
    'text-hud-shadow text-sm font-medium tracking-wide transition-opacity hover:opacity-80';

  return (
    <header className="fixed inset-x-0 top-0 z-30">
      {/* 上バー: 左端=サイト名 / 中央=ページリンク(PC・絶対中央) / 右端=時間帯 or ハンバーガー。
          背景の明暗に依らず読めるよう、文字は白 + 濃い黒影(text-hud-shadow)。スクリムは無し(ユーザーFB)。 */}
      <div className="relative flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* サイト名(タイトル)= 画面左端。アイコンなし。 */}
        <Link
          to="/"
          className="text-hud-shadow text-sm font-semibold tracking-[0.2em] transition-opacity hover:opacity-80 sm:text-base"
          style={{ fontFamily: 'var(--font-display)', color: '#fff' }}
          onClick={() => setMenuOpen(false)}
        >
          KOZAKI KAORU
        </Link>

        {/* ページリンク(PC・画面中央)= 素のテキストリンク。絶対配置で中央寄せ。 */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 md:flex"
          aria-label="メインナビゲーション"
        >
          {PANELS.map((p) => (
            <NavLink
              key={p.id}
              to={p.to}
              className={deskLinkClass}
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-neon-glow)' : '#fff',
              })}
            >
              {p.label}
            </NavLink>
          ))}
        </nav>

        {/* 時間帯スイッチャー(PC・画面右端)。 */}
        <div className="hidden md:block">
          <TimeSwitcher />
        </div>

        {/* ハンバーガー(スマホのみ・右端)。ページリンク + 時間帯スイッチャーを開閉。 */}
        <button
          type="button"
          className="glass-dark inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 md:hidden"
          aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* スマホ展開メニュー(ページリンク + 時間帯スイッチャー)。開いている時だけ描画。 */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="glass-dark relative z-10 mx-4 mb-2 rounded-2xl p-4 md:hidden"
        >
          <nav
            className="flex flex-col gap-0.5"
            aria-label="メインナビゲーション（モバイル）"
          >
            {PANELS.map((p) => (
              <NavLink
                key={p.id}
                to={p.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-neon-glow'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {p.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 flex justify-center border-t border-white/10 pt-3">
            <TimeSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
