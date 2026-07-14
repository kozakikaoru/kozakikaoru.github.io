// AI 楽曲のトラック定義。音源(mp3 等)が用意でき次第 src にパスを足すだけで
// レコードプレイヤーが再生できる(src 無しの曲は COMING SOON 表示・再生不可)。
// ★ 依頼主が音源を用意したら: public/audio/ に mp3 を置き、該当曲の src に
//   '/audio/ファイル名.mp3' を追記するだけ。youtubeUrl も決まり次第追記する。
//   歌詞は lyrics に「空行でブロック区切り」のテキストを入れると、プレイヤー下に表示される。

// CD 盤面に印刷する画像(キャラアート等)。import で Vite がハッシュ URL 化する。
import kakuteiCover from '../assets/music/kakutei-shinkoku.webp';

export interface Track {
  id: string;
  /** 曲名(表示)。 */
  title: string;
  /** 英字サブ(計器タグ用・ASCII)。 */
  sub: string;
  /** 2行程度の紹介文(仮)。 */
  desc: string;
  /** 制作日(表示用・'YYYY.MM.DD')。未指定なら出さない。 */
  date?: string;
  /** 再生時間ラベル(表示用・'M:SS')。プレイリストに即時表示する(未指定は現在曲のみ実測表示)。 */
  durationLabel?: string;
  /** 音源 URL(/audio/xxx.mp3 等)。未提供なら undefined。 */
  src?: string;
  /** YouTube 公開 URL。未定なら undefined(リンクを出さない)。 */
  youtubeUrl?: string;
  /** 歌詞(空行でブロック区切り・改行で各行)。未提供なら歌詞 UI は「準備中」表示。 */
  lyrics?: string;
  /** 盤面の見た目。image があれば CD 盤面に画像を貼る。無ければグラデ2色+イニシャル。 */
  art: { c1: string; c2: string; glow: string; initials: string; image?: string };
}

export const TRACKS: Track[] = [
  {
    id: 'kakutei-shinkoku',
    title: '確定申告やりたくない',
    sub: 'TRK 01',
    desc: '確定申告の憂うつをそのまま叫んだ、AI制作のコミカルなトラック。勢いだけで一気に仕上げた1曲です。',
    date: '2026.01.13',
    durationLabel: '1:36',
    src: '/audio/kakutei-shinkoku.mp3',
    lyrics: `確定申告 やりたくない
やりたくない やりたくない
確定申告 やりたくない
やりたくない やりたくない

確定申告 やりたくない
領収書全然足りない
確定申告 やりたくない
税金払いたくない

確定申告 やりたくない
マイナンバー作らなきゃ
確定申告 やりたくない
寝転んでたら夢の中

やりたくない 確定申告
所得税 消費税
やりたくない 確定申告
税務署 燃やすぞ

面倒臭い 確定申告
頭が割れそう
面倒臭い 確定申告
脱税しちゃうぞ

確定申告 面倒臭い
控除証明 行方不明
確定申告 面倒臭い
インボイスって何ボイス？

確定申告 面倒臭い
とか言ってる場合でもない
確定申告 面倒臭い
寝転んでたら夢の中

やりたくない 確定申告
所得税 消費税
やりたくない 確定申告
税務署 燃やすぞ

面倒臭い 確定申告
頭が割れそう
面倒臭い 確定申告
脱税しちゃうぞ`,
    art: {
      c1: '#ff9e2c',
      c2: '#ff2e4c',
      glow: '#ffd28a',
      initials: '確申',
      image: kakuteiCover,
    },
  },
];
