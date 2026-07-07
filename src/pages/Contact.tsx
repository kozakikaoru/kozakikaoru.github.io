// お問い合わせ(Contact)ページ。仕事の依頼を受ける導線。
// フォームは送信先が未定なので、今は「見た目 + mailto フォールバック」で用意し、
// 送信バックエンド(Formspree 等)は ★依頼主の決定後に接続する。
import { useState, type FormEvent } from 'react';
import { PageShell } from '../components/PageShell';

// ★ 依頼主が連絡先を用意したら差し替える。
const CONTACT_EMAIL = 'your-email@example.com';
const SOCIAL_LINKS: { label: string; href: string }[] = [
  { label: 'GitHub', href: '#' }, // ★差し替え
  { label: 'X (Twitter)', href: '#' }, // ★差し替え
  { label: 'Zenn / Blog', href: '#' }, // ★差し替え
];

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
    >
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="glass-dark space-y-4 rounded-3xl p-6 text-white sm:p-8"
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
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-neon-cyan"
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
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-neon-cyan"
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
              className="w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-neon-cyan"
              placeholder="プロジェクトの概要、ご希望の時期、ご予算感などをお書きください。"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl py-3 font-semibold text-slate-900 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(90deg, #a5f3fc, #4dd0e1)',
              boxShadow: '0 8px 24px rgba(77,208,225,0.4)',
            }}
          >
            送信する
          </button>

          {sent && (
            <p
              role="status"
              className="rounded-xl bg-emerald-400/15 px-4 py-3 text-sm text-emerald-200"
            >
              メーラーを起動しました。送信が完了しない場合は、下記メール宛に直接ご連絡ください。
            </p>
          )}

          <p className="text-center text-[11px] text-white/40">
            ※ 現在フォームはメール送信（mailto）で動作します。送信サービスとの連携は準備中です。
          </p>
        </form>

        {/* 連絡先 / SNS */}
        <aside className="space-y-4">
          <div className="glass rounded-3xl p-6 text-slate-800">
            <h2 className="text-sm font-bold">直接のご連絡</h2>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 block break-all text-sm font-medium text-slate-700 underline decoration-neon-cyan underline-offset-4 hover:text-slate-900"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="glass-dark rounded-3xl p-6 text-white">
            <h2 className="mb-3 text-sm font-bold">その他のリンク</h2>
            <ul className="space-y-2">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                    target={s.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      s.href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
