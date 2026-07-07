import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // ルート配信を前提に '/' を既定にする(SPA ルーティングとの相性のため相対 './' は避ける)。
  // GitHub Pages のサブパス(例: https://user.github.io/portfolio/)に置く場合のみ
  // base を '/portfolio/' に変更する。basename(main.tsx)が自動追従する。
  base: '/',
  server: {
    // ngrok 等のトンネル経由(iPhone 実機で確認する等)で開くと、Host ヘッダがトンネルの
    // ドメインになり、Vite の DNS リバインディング対策(allowedHosts)で弾かれる
    // ("Blocked request. This host ... is not allowed")。ngrok の各ドメインの
    // サブドメインを許可する(先頭ドット = 全サブドメイン一致・URL が変わっても有効)。
    // localhost / IP アドレスは既定で常に許可される。
    // ※ 開発サーバー(vite dev)専用の設定。本番ビルド(vite build)には一切影響しない。
    allowedHosts: [
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.app',
      '.ngrok.io',
    ],
  },
  plugins: [react(), tailwindcss()],
  build: {
    // 自己ホスト Web フォント(woff2)は必ず別ファイルとして出力する。
    // Vite は既定で 4KB 未満のアセットを base64 data URI として JS バンドルに
    // インライン化するが、サブセット woff2 は数 KB のため小さいものが
    // バンドルへ埋め込まれ JS が肥大化する(初回パースが重くなる)。
    // フォントはブラウザキャッシュの効く独立ファイルで配信したいので、
    // woff2 だけインライン化を無効化する(他アセットは既定挙動のまま)。
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.woff2') ? false : undefined,
  },
})
