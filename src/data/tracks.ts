// AI 楽曲のトラック定義。音源(mp3 等)が用意でき次第 src にパスを足すだけで
// レコードプレイヤーが再生できる(src 無しの曲は COMING SOON 表示・再生不可)。
// ★ 依頼主が音源を用意したら: public/audio/ に mp3 を置き、該当曲の src に
//   '/audio/ファイル名.mp3' を追記するだけ。youtubeUrl も決まり次第追記する。

export interface Track {
  id: string;
  /** 曲名(表示)。 */
  title: string;
  /** 英字サブ(計器タグ用・ASCII)。 */
  sub: string;
  /** 2行程度の紹介文(仮)。 */
  desc: string;
  /** 音源 URL(/audio/xxx.mp3 等)。未提供なら undefined。 */
  src?: string;
  /** YouTube 公開 URL。未定なら undefined(リンクを出さない)。 */
  youtubeUrl?: string;
  /** レコード盤中央ラベルの見た目(グラデ2色+光彩+イニシャル)。 */
  art: { c1: string; c2: string; glow: string; initials: string };
}

export const TRACKS: Track[] = [
  {
    id: 'neon-bloom',
    title: 'Neon Bloom',
    sub: 'TRK 01',
    desc: 'AIと一緒に制作したエレクトロニックな一曲です。夜の街にネオンの花が咲いていくイメージを音にしました。',
    art: { c1: '#05d9e8', c2: '#b14dff', glow: '#7ff3ff', initials: 'NB' },
  },
  {
    id: 'margaret-field',
    title: 'Margaret Field',
    sub: 'TRK 02',
    desc: 'AIと制作した、やわらかい音色のトラックです。マーガレットの咲く野原をゆっくり歩くような気分で聴いてください。',
    art: { c1: '#ff9e2c', c2: '#ff5566', glow: '#ffd28a', initials: 'MF' },
  },
  {
    id: 'midnight-grid',
    title: 'Midnight Grid',
    sub: 'TRK 03',
    desc: 'AIと制作したダウンテンポなトラックです。深夜の碁盤の目の街を見下ろすような、静かな浮遊感がテーマです。',
    art: { c1: '#1f8fff', c2: '#0b1a2a', glow: '#7ff3ff', initials: 'MG' },
  },
];
