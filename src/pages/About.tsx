// 自己紹介ページ。顔写真(プレースホルダ)+ 経歴文 + スキル。
import { PageShell } from '../components/PageShell';
import { PROFILE } from '../data/profile';

export default function About() {
  return (
    <PageShell
      title="自己紹介"
      sub="ABOUT"
      lead={PROFILE.tagline}
    >
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* 顔写真 or プレースホルダ */}
        <div>
          <div className="glass overflow-hidden rounded-3xl p-2">
            {PROFILE.avatarUrl ? (
              <img
                src={PROFILE.avatarUrl}
                alt={`${PROFILE.name}の顔写真`}
                className="aspect-square w-full rounded-2xl object-cover"
              />
            ) : (
              // ★顔写真プレースホルダ(用意でき次第 PROFILE.avatarUrl に設定)
              <div
                className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl text-white/80"
                style={{
                  background:
                    'linear-gradient(140deg, #4dd0e1 0%, #7bb661 60%, #f4a261 100%)',
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-16 w-16 text-white/70" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
                </svg>
                <span className="mt-2 text-xs tracking-wide">
                  顔写真（準備中）
                </span>
              </div>
            )}
          </div>

          {/* ちょっとした事実 */}
          <dl className="glass-dark mt-4 space-y-2 rounded-2xl p-4 text-sm text-white/90">
            {PROFILE.facts.map((f) => (
              <div key={f.label} className="flex justify-between gap-3">
                <dt className="text-white/60">{f.label}</dt>
                <dd className="text-right font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 本文 */}
        <div>
          <div className="glass-dark rounded-3xl p-6 text-white sm:p-8">
            <p
              className="text-sm tracking-[0.3em] text-neon-glow"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {PROFILE.nameEn}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{PROFILE.name}</h2>
            <p className="mt-1 text-sm text-white/70">{PROFILE.role}</p>

            <div className="mt-6 space-y-4 leading-relaxed text-white/90">
              {PROFILE.bio.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* スキル(単独ページを持たず、ここに内包) */}
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-white">
              スキル
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {PROFILE.skills.map((group) => (
                <div
                  key={group.category}
                  className="glass rounded-2xl p-4"
                >
                  <p className="mb-2 text-sm font-bold text-slate-800">
                    {group.category}
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full bg-slate-900/10 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
