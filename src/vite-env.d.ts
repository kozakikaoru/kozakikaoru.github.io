/// <reference types="vite/client" />

// 画像アセットの import 型(Vite が URL 文字列に解決する)。
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.avif' {
  const src: string;
  export default src;
}
