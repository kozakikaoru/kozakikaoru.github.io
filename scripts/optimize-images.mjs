// 背景画像をロスレス WebP に変換するスクリプト。
// 無劣化(ロスレス)方針: WebP lossless + AVIF(高品質)を生成し、
// 生成後のサイズを比較して小さい方をアプリで使えるようにする。
// 実行: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../src/assets/backgrounds');

const targets = [
  'margaret-morning',
  'margaret-day',
  'margaret-evening',
  'margaret-night',
];

function fmt(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

async function run() {
  console.log('背景画像をロスレス最適化します...\n');
  for (const name of targets) {
    const srcPng = path.join(SRC_DIR, `${name}.png`);
    const outWebp = path.join(SRC_DIR, `${name}.webp`);
    const outAvif = path.join(SRC_DIR, `${name}.avif`);

    const pngStat = await stat(srcPng);

    // ロスレス WebP: 完全に無劣化。effort 6 で最大圧縮。
    await sharp(srcPng)
      .webp({ lossless: true, effort: 6 })
      .toFile(outWebp);
    const webpStat = await stat(outWebp);

    // AVIF: ロスレス AVIF は写真だと肥大しがちなので、高品質(見た目無劣化)設定。
    // quality 90 + 4:4:4 サブサンプリングで色ずれを防ぐ。
    await sharp(srcPng)
      .avif({ quality: 90, effort: 6, chromaSubsampling: '4:4:4' })
      .toFile(outAvif);
    const avifStat = await stat(outAvif);

    console.log(`${name}:`);
    console.log(`  PNG (元):        ${fmt(pngStat.size)}`);
    console.log(`  WebP (lossless): ${fmt(webpStat.size)}`);
    console.log(`  AVIF (q90):      ${fmt(avifStat.size)}`);
    console.log('');
  }

  const all = await readdir(SRC_DIR);
  console.log('生成物:', all.filter((f) => !f.endsWith('.png')).join(', '));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
