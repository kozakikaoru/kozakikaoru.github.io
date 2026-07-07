// できること(Services)ページ。何を頼めるか + 稼働形態。依頼獲得の要。
import { Link } from 'react-router';
import { PageShell } from '../components/PageShell';
import { SERVICES, WORK_STYLES } from '../data/services';

export default function Services() {
  return (
    <PageShell
      title="できること"
      sub="SERVICES"
      lead="Web を中心に、企画から実装・運用まで幅広くお手伝いできます。ご相談内容に合わせて柔軟に対応します。"
    >
      {/* サービス一覧 */}
      <div className="grid gap-5 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <article
            key={s.id}
            className="glass-dark flex flex-col rounded-3xl p-6 text-white"
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                aria-hidden="true"
              >
                <span className="h-2.5 w-2.5 rounded-sm bg-neon-glow" />
              </span>
              <h2 className="text-lg font-bold">{s.title}</h2>
            </div>
            <p className="text-sm text-white/80">{s.summary}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-white/90">
              {s.details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="text-neon-glow" aria-hidden="true">
                    ▹
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* 稼働形態 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">
          稼働・契約について
        </h2>
        <dl className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-2">
          {WORK_STYLES.map((w) => (
            <div key={w.label}>
              <dt className="text-xs font-semibold tracking-wide text-slate-500">
                {w.label}
              </dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {w.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(90deg, #a5f3fc, #4dd0e1)',
            boxShadow: '0 8px 24px rgba(77,208,225,0.4)',
          }}
        >
          お問い合わせはこちら →
        </Link>
      </div>
    </PageShell>
  );
}
