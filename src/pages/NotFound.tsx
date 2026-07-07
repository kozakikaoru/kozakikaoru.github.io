// 404 ページ。世界観を保ちつつ TOP への導線を出す。
import { PageShell } from '../components/PageShell';
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <PageShell
      title="ページが見つかりません"
      sub="404"
      lead="お探しのページは、花畑のどこかに迷い込んでしまったようです。"
    >
      <div className="glass-dark rounded-3xl p-8 text-center text-white">
        <p
          className="text-6xl font-bold text-neon-glow"
          style={{ fontFamily: "'Dela Gothic One', var(--font-display)" }}
        >
          404
        </p>
        <p className="mt-4 text-white/85">
          URL をご確認いただくか、下のボタンからトップへお戻りください。
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full px-6 py-3 font-semibold text-slate-900"
          style={{
            background: 'linear-gradient(90deg, #a5f3fc, #4dd0e1)',
          }}
        >
          ホームへ戻る
        </Link>
      </div>
    </PageShell>
  );
}
