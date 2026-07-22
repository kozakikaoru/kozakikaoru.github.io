// プロフィールページ。パネルは2枚だけ(ユーザー指示「ごちゃごちゃさせない」):
//   左 = 顔写真 + 基本情報(拠点・生年月日)+ SNS リンク(まとまりの一番下)
//   右 = 名前 + 自己紹介 + スキル(カテゴリごとのアイコン付きチップ)
import { PageShell } from '../components/PageShell';
import {
  Chip,
  HudCard,
  IconGitHub,
  IconX,
  MONO,
} from '../components/HudKit';
import { SkillIcon } from '../components/SkillIcon';
import { PROFILE } from '../data/profile';

// ページアクセント(panels.ts の about と同色)。
const ACCENT = '#b14dff';

export default function About() {
  return (
    <PageShell title="プロフィール" accent={ACCENT}>
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* ==== 左: 写真 + 基本情報 + SNS(1枚のパネルに集約)==== */}
        <HudCard pad={false} className="self-start">
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
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-16 w-16 text-white/70"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
                </svg>
                <span className="mt-2 text-xs tracking-wide">顔写真（準備中）</span>
              </div>
            )}
          </div>

          {/* 並び順(ユーザー指示): 名前 → 肩書き → SNS → 拠点 → 生年月日 */}
          <div className="px-4 pb-4">
            {/* 名前 + 肩書き(写真の下)。英字名は HUD の計器ラベル風(等幅+広字間+文字用アクセント色)。 */}
            <div className="pt-1">
              <p
                className="text-xs font-semibold tracking-[0.3em]"
                style={{ fontFamily: MONO, color: 'var(--page-accent-text)' }}
              >
                {PROFILE.nameEn}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {PROFILE.name}
              </h2>
              <p className="mt-1 text-sm text-white/75">{PROFILE.role}</p>
            </div>

            {/* SNS(肩書きの下)。枠なしでアイコンをベタ置き(ユーザー指示)。
                見た目は枠なしだがタップ領域 44px は確保する。
                アイコンだけになるので aria-label でリンク名を担保。 */}
            <div className="-ml-2 mt-3 flex gap-1">
              {PROFILE.socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.label} ${s.handle}`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-white/85 transition-opacity hover:opacity-70"
                >
                  {s.label === 'GitHub' ? (
                    <IconGitHub className="h-8 w-8" />
                  ) : (
                    <IconX className="h-[30px] w-[30px]" />
                  )}
                </a>
              ))}
            </div>

            {/* 基本情報(拠点・生年月日)。SNS の下・罫線で区切る。 */}
            <dl className="mt-4 space-y-2 border-t border-white/[0.08] pt-4 text-sm text-white/90">
              {PROFILE.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-white/75">{f.label}</dt>
                  <dd className="text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </HudCard>

        {/* ==== 右: 名前 + 自己紹介 + スキル(1枚のパネルに集約)==== */}
        <HudCard className="text-white sm:p-8">
          {/* 名前ブロックは左パネル(写真の下)へ移動済み。ここは自己紹介本文から始める。
              段落間は space-y-4、段落内の句点改行(\n)は whitespace-pre-line で反映。 */}
          <div className="space-y-4 leading-relaxed text-white/90">
            {PROFILE.bio.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>

          {/* スキル(同じパネル内・罫線で区切る)。
              内容はスキルシート(職務経歴)と GitHub リポジトリから整理。 */}
          <div className="mt-7 border-t border-white/[0.08] pt-6">
            <h3 className="flex items-center gap-2.5 text-base font-bold">
              <span
                aria-hidden="true"
                className="inline-block h-4 w-1 -skew-x-12 rounded-[1px]"
                style={{
                  background: 'var(--page-accent)',
                  boxShadow: '0 0 8px var(--page-accent)',
                }}
              />
              スキル
            </h3>
            <div className="mt-4 space-y-5">
              {PROFILE.skills.map((group) => (
                <div key={group.category}>
                  <p className="text-xs text-white/75">{group.category}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <li key={item}>
                        <Chip className="gap-1.5">
                          <SkillIcon name={item} />
                          {item}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </HudCard>
      </div>
    </PageShell>
  );
}
