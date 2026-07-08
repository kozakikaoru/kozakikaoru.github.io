// アプリのルートレイアウト。全ページ共通で以下を配置する:
// - TimeBackground: 時間帯連動の背景(全ページ共通の世界観)
// - LoadingScreen: 初期ロード中の演出
// - Nav / Footer: 共通ヘッダー・フッター
// - Routes: 各ページ
import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { TimeBackground } from './components/TimeBackground';
import { LoadingScreen } from './components/LoadingScreen';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { usePreloadImages } from './hooks/usePreloadImages';
import { useAppStore } from './store/useAppStore';

// TOP は初回に必ず要るので同期 import。下層は遅延ロードで初期バンドルを軽く。
import Home from './pages/Home';
const About = lazy(() => import('./pages/About'));
const Music = lazy(() => import('./pages/Music'));
const Works = lazy(() => import('./pages/Works'));
const Career = lazy(() => import('./pages/Career'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** ページ遷移時に先頭へスクロールする。 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

/** タブ復帰時に端末時刻を再判定する(手動選択中は表示に影響しない)。 */
function useRefreshTimeOnFocus() {
  const refresh = useAppStore((s) => s.refreshAutoTimeOfDay);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);
}

export default function App() {
  // 初期ロード: 背景画像を先読みし、進捗をローディング画面に反映。
  usePreloadImages();
  useRefreshTimeOnFocus();

  return (
    <>
      {/* 背景(全ページ共通・最背面) */}
      <TimeBackground />

      {/* ヘッダー */}
      <Nav />

      {/* 各ページ */}
      <Suspense fallback={<PageFallback />}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/music" element={<Music />} />
          <Route path="/works" element={<Works />} />
          <Route path="/career" element={<Career />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* フッター(TOP では余白が邪魔になるので下層ページ用。TOP は全画面ヒーロー) */}
      <FooterSlot />

      {/* ローディング画面(最前面・完了で自動的に消える) */}
      <LoadingScreen />
    </>
  );
}

/** 遅延ページ読み込み中の簡易フォールバック。 */
function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-white/70">
      <span className="animate-pulse text-sm tracking-widest">Loading…</span>
    </div>
  );
}

/** TOP 以外のページでだけフッターを出す。 */
function FooterSlot() {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <Footer />;
}
