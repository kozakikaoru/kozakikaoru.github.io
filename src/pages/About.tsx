// 自己紹介ページ。顔写真 + プロフィール本文 + スキル。
// レイアウト(写真+facts | 本文+スキル)は従来どおり、カード類を HudKit
// (ダークガラス+アクセントヘアライン)へ置き換え、旧ライトガラスを全廃。
import { PageShell } from '../components/PageShell';
import { Chip, HudCard, MONO, SectionHeading } from '../components/HudKit';
import { PROFILE } from '../data/profile';

// ページアクセント(panels.ts の about と同色)。
const ACCENT = '#b14dff';

export default function About() {
  return (
    <PageShell title="自己紹介" sub="PROFILE" accent={ACCENT}>
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* 顔写真 or プレースホルダ(HudCard の額装風・内側に細い余白) */}
        <div>
          <HudCard pad={false}>
            <div className="p-2">
              {PROFILE.avatarUrl ? (
                <img
                  src={PROFILE.avatarUrl}
                  alt={`${PROFILE.name}の顔写真`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                // ★顔写真プレースホルダ(用意でき次第 PROFILE.avatarUrl に設定)
                <div
                  className="flex aspect-square w-full flex-col items-center justify-center rounded-xl text-white/80"
                  style={{
                    background:
                      'linear-gradient(140deg, color-mix(in srgb, var(--page-accent) 45%, #0a1526), #0a1526)',
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
          </HudCard>

          {/* ちょっとした事実 */}
          <HudCard pad={false} className="mt-4">
            <dl className="space-y-2 p-4 text-sm text-white/90">
              {PROFILE.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-3">
                  <dt className="text-white/75">{f.label}</dt>
                  <dd className="text-right font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </HudCard>
        </div>

        {/* 本文 */}
        <div>
          <HudCard className="text-white sm:p-8">
            {/* 英字名は HUD の計器ラベル風(等幅+広字間+アクセント色)。
                生アクセントは暗いカードの上で 1.8:1 しか出ないため文字用の明るい版を使う。 */}
            <p
              className="text-xs font-semibold tracking-[0.3em]"
              style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
            >
              {PROFILE.nameEn}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{PROFILE.name}</h2>
            <p className="mt-1 text-sm text-white/75">{PROFILE.role}</p>

            <div className="mt-6 space-y-4 leading-relaxed text-white/90">
              {PROFILE.bio.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </HudCard>

          {/* スキル(単独ページを持たず、ここに内包) */}
          <div className="mt-6">
            <SectionHeading>スキル</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              {PROFILE.skills.map((group) => (
                <HudCard key={group.category} pad={false}>
                  <div className="p-4">
                    <p className="mb-2.5 text-sm font-bold text-white">
                      {group.category}
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <li key={item}>
                          <Chip>{item}</Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HudCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
