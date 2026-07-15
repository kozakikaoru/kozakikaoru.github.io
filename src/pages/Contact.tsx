// お問い合わせ(Contact)ページ。仕事の依頼を受ける導線。
// フォームは送信先が未定なので、今は「見た目 + mailto フォールバック」で用意し、
// 送信バックエンド(Formspree 等)は ★依頼主の決定後に接続する。
import { useState, type FormEvent } from 'react';
import { PageShell } from '../components/PageShell';
import { HudCard, NeonButton } from '../components/HudKit';

// ページアクセント(panels.ts の contact と同色)。
const ACCENT = '#1f8fff';

// ★ 依頼主が連絡先を用意したら差し替える(勝手に個人メールは公開しない)。
const CONTACT_EMAIL = 'your-email@example.com';
// 実在する URL のみ載せる(死にリンク禁止)。X / Zenn 等は実 URL が届いたら足す。
const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: 'GitHub', href: 'https://github.com/kozakikaoru' },
];

// input / textarea の共通スタイル。focus 時の枠線はページアクセント。
// プレースホルダは入力済みの値(text-white)とはっきり区別が付く必要があるので
// 白のままにはできない。/40 は薄すぎたため /55 まで上げて折り合いを付けている。
const FIELD_CLASS =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-white/55 outline-none focus:border-[var(--page-accent)]';

export default function Contact() {
  const [sent, setSent] = useState(false);

  // 送信バックエンド未接続のため、mailto でメーラーを開くフォールバック。
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '');
    const email = String(data.get('email') ?? '');
    const message = String(data.get('message') ?? '');
    const subject = encodeURIComponent(`【お問い合わせ】${name} 様より`);
    const body = encodeURIComponent(
      `お名前: ${name}\nメール: ${email}\n\n${message}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <PageShell
      title="お問い合わせ"
      sub="CONTACT"
      lead="お仕事のご相談・ご依頼はこちらから。内容を確認のうえ、折り返しご連絡します。お気軽にどうぞ。"
      accent={ACCENT}
    >
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* フォーム */}
        <HudCard pad={false}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 text-white sm:p-8"
          >
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                お名前 <span className="text-neon-magenta">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                className={FIELD_CLASS}
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                メールアドレス <span className="text-neon-magenta">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={FIELD_CLASS}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-medium"
              >
                ご相談内容 <span className="text-neon-magenta">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className={`resize-y ${FIELD_CLASS}`}
                placeholder="プロジェクトの概要、ご希望の時期、ご予算感などをお書きください。"
              />
            </div>

            <NeonButton type="submit" className="w-full">
              送信する
            </NeonButton>

            {sent && (
              <p
                role="status"
                className="rounded-xl bg-emerald-400/15 px-4 py-3 text-sm text-emerald-200"
              >
                メーラーを起動しました。送信が完了しない場合は、下記メール宛に直接ご連絡ください。
              </p>
            )}

            <p className="text-center text-[11px] text-white/75">
              ※ 現在フォームはメール送信（mailto）で動作します。送信サービスとの連携は準備中です。
            </p>
          </form>
        </HudCard>

        {/* 連絡先 / SNS */}
        <aside className="space-y-4">
          <HudCard pad={false} className="text-white">
            <div className="p-6">
              <h2 className="text-sm font-bold">直接のご連絡</h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 block break-all text-sm font-medium text-white/85 underline decoration-[var(--page-accent)] underline-offset-4 transition-colors hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </HudCard>

          <HudCard pad={false} className="text-white">
            <div className="p-6">
              <h2 className="mb-3 text-sm font-bold">その他のリンク</h2>
              <ul className="space-y-2">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </HudCard>
        </aside>
      </div>
    </PageShell>
  );
}
