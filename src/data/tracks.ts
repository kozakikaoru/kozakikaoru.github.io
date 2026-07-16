// AI 楽曲のトラック定義。並びは新しい曲が上(素材フォルダ 00〜09 = 制作順の逆)。
// 曲を追加するとき: public/audio/ に mp3 を置き、src/assets/music/ に 640x640 の webp を
// 置いて、下の TRACKS の先頭に 1 件足し、sub の TRK 通番を振り直す。
// - lyrics は空行でブロック区切り。行末に空白を入れない。
// - art.image があれば CD 盤面に画像を貼る。c1/c2/initials は画像が出ない時のフォールバック、
//   glow はプレイリストの再生中行の発光に使う(画像があっても効く)。

// CD 盤面に印刷する画像(キャラアート等)。import で Vite がハッシュ URL 化する。
import afterImageCover from '../assets/music/after-image.webp';
import kakuteiShinkokuCover from '../assets/music/kakutei-shinkoku.webp';
import sayonaraMeltlightCover from '../assets/music/sayonara-meltlight.webp';
import splashSignalCover from '../assets/music/splash-signal.webp';
import cottonCandyHipDropCover from '../assets/music/cotton-candy-hip-drop.webp';
import spinTheLifeCover from '../assets/music/spin-the-life.webp';
import nyantStopMeCover from '../assets/music/nyant-stop-me.webp';
import dennouTranslateCover from '../assets/music/dennou-translate.webp';
import fukuokaTeppanyakiCover from '../assets/music/fukuoka-teppanyaki.webp';
import loveDynamiteCover from '../assets/music/love-dynamite.webp';

export interface Track {
  id: string;
  /** 曲名(表示)。 */
  title: string;
  /** 英字サブ(計器タグ用・ASCII)。表示順の通番。 */
  sub: string;
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
    id: 'after-image',
    title: 'アフターイメージ',
    sub: 'TRK 01',
    date: '2026.01.15',
    durationLabel: '3:14',
    src: '/audio/after-image.mp3',
    lyrics: `ペダル刻む morning light
止まらない秒針 ride
歪む景色が turn me back
記憶の dust 踏み鳴らす track

シグナル交差点滅 frame
焼きつく風が頬を撫でる game
登り慣れた坂道 なのに fade
時差ボケのように 滲む name
止まらぬ季節、重なる voice
口にできずに詰まった choice
where we go? って問いかけた
あの日の影を今また跨いだ

Don’t stop, 錆びた chain noise
追い越す想い出、fast forward boys
弾けた笑い声 slice like knife
通り雨みたいな青春 life
戸惑う心に click & dash
畳み掛ける beat に match
ただの午後3時だけど magic
交差点で踊る記憶 tragic

揺れるスローモーションで dive
ハートごと shake, and feel alive
ひび割れた空でも舞える
まばたきの一瞬が forever
すれ違った台詞の続き
心の奥 still replay
戻れないならこのまま
夢の中でまた会えたら

止まらない flow, heartbeat jump
光の速度で過去に punch
すれ違いざまの言葉が dance
何度も巡る unfinished chance
影落としたノートの margiin
読めない未来は silence
でも走るのさ without regret
駆け抜ける今が my asset

息潜めていた truth
誰にも言えず fade into youth
街頭 flicker, セピアの past
嘘じゃないけど real も loose
シャツの裾揺れた風が guide
消せない痛みも rhyme に ride
記憶ってやつは無敵な loop
なのに出口は見えない maze

揺れるスローモーションで dive
ハートごと shake, and feel alive
ひび割れた空でも舞える
まばたきの一瞬が forever
すれ違ったセリフの続き
心の奥 still replay
戻れないならこのまま
夢の中でまた会えたら

影踏む放課後の shade
君が残した cascade
二度と戻れない parade
けど今も胸が invade
一秒ごと変わる sky
追いつけないでも try
明日なんて不確定
今を生きるだけ that’s fate

閉じたページがめくれてく
音もなくリンクする記憶
揺れる視界に touch & go
Let it flow, let it flow
瞬間が全て say no more
どこにいたってもう戻れない
でもこの鼓動だけはリアル
so we ride, so we fly

揺れるスローモーションで dive
ハートごと shake, and feel alive
ひび割れた空でも舞える
まばたきの一瞬が forever
すれ違ったセリフの続き
心の奥 still replay
戻れないならこのまま
夢の中でまた会えたら

信号がまた blinking light
通り過ぎたあの日の sight
名前を呼ぶ声が遠く
でも今ここで二人続く`,
    art: {
      c1: '#379eda',
      c2: '#146299',
      glow: '#91caeb',
      initials: 'アフ',
      image: afterImageCover,
    },
  },
  {
    id: 'kakutei-shinkoku',
    title: '確定申告やりたくない',
    sub: 'TRK 02',
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
      c1: '#8f5a24',
      c2: '#046c5c',
      glow: '#c1a487',
      initials: '確申',
      image: kakuteiShinkokuCover,
    },
  },
  {
    id: 'sayonara-meltlight',
    title: 'サヨナラメルトライト',
    sub: 'TRK 03',
    date: '2026.01.08',
    durationLabel: '3:10',
    src: '/audio/sayonara-meltlight.mp3',
    lyrics: `ねぇ またひとりになってる
窓の外にピンクが沈んでく
制服のボタン外したら
ちょっとだけ自由なビート

放課後ミルクティー飲み干すルーティーン
屋上 スモークと靴音ルーピン
誰にも言えないことが多すぎて
今日もまた嘘ついてるって気づいてる
アイシャドウじゃ隠せないムード
教室より広がるグルーヴ
照らされた髪がゆらゆらと
この日常が全部メタファー

鳴らないチャイム　響くビート
教科書よりも生っぽいリリック
ふいに笑った自分の声に
ちょっと泣きそうになってる夕日

サヨナラメルトライト
言いかけた言葉 溶けてない
制服のまま踊る Tonight
秘密はいつも軽やかなライン
サヨナラメルトライト
ピンクの空に溶けた Cry
煙の向こうのリアルを Fly
誰も知らない今だけ Try

マスカラちょっと落ちたまま
気にしないで踏んだステップがバラバラ
だけどそのズレが気持ちいい
完璧じゃないから続けたい
階段で書いたノートのリリック
未来よりも今の響きがヒット
息を切らして笑った帰り道
これがわたしの青春のビート

正しさより鮮やかさで
意味じゃなくて感覚で
誰にも見せないこのフロー
窓に映った私が証拠

サヨナラメルトライト
言いすぎたセリフ またRewrite
制服のまま揺れるMidnight
ちぐはぐな夢も可愛いじゃない？
サヨナラメルトライト
消えかけの月にかざすMic
いつかの涙もMixして
この瞬間にリップして

もうすぐ朝が来るって知ってた
でもこの煙が最後って決めた
誰にも届かない声で歌う
ひとりきりのダンスクラブ

サヨナラメルトライト
さよならも悪くないって Sky
制服のままのビートで Fly
世界が眠ってる間だけ Try
サヨナラメルトライト
明日なんてまだ来ない
きらきらしない今日の Line
それすら愛してみたかった My Life`,
    art: {
      c1: '#1d60c3',
      c2: '#64b2e4',
      glow: '#83a8de',
      initials: 'サヨ',
      image: sayonaraMeltlightCover,
    },
  },
  {
    id: 'splash-signal',
    title: 'Splash Signal',
    sub: 'TRK 04',
    date: '2026.01.05',
    durationLabel: '3:08',
    src: '/audio/splash-signal.mp3',
    lyrics: `夜空の下 きらめくプール
ピンクのWi-Fi 繋がる気分
ふたりだけのSignal
Bounceして Baby ほら Listen

ピカピカ光るネオンライン
ぐるぐる回る心デザイン
波打つBassに合わせてJump
君の笑顔がピンクにPump
Splash! Splash! 水面に描く
ふたりのコードが絡むMagic
「ねぇねぇ」って言うたびにYes
この夜 逃さない High‑Speed Quest

Check it
遠回りしないHeart
ピンク電波でダンスStart
Check it
揺れるPulseかき鳴らせ
Stop! なんてないState

ナイトプールにピンクのWi‑Fi
Ping! Ping! もう止まらないRide
Catch! Catch! 心のSignal
Boom! Boom! 高鳴るAnimal
ナイトプールにピンクのWi‑Fi
Ping! Ping! ふたりのHigh‑Light
Splash! Splash! 音に溶けてく
ナイトプールにピンクのWi‑Fi

転がるワードはCandy Code
キラめくフレーズいつもReload
ムニャムニャ言葉が踊るScene
ノイズなんて None, just Dream
ズキュン! って来たらその瞬間
タイミング掴んで Beat Drop Anthem
Back! Back! もう迷わない
光る夜に恋をハック

Check it
溶けてくこのRhythm
ピンク色に染まるSystem
Check it
跳ねるPulse かき鳴らせ
Stop! 何もないState

ナイトプールにピンクのWi‑Fi
Ping! Ping! もう止まらないRide
Catch! Catch! 心のSignal
Boom! Boom! 高鳴るAnimal
ナイトプールにピンクのWi‑Fi
Ping! Ping! ふたりのHigh‑Light
Splash! Splash! 音に溶けてく
ナイトプールにピンクのWi‑Fi

Chu! Chu! 気持ちがLoop
Boom! Boom! 2人のProof
Hold! Hold! 時間をFreeze
Glow! Glow! 君だけPlease

ナイトプールにピンクのWi‑Fi
Ping! Ping! 電波越えたLove
Catch! Catch! 映えるSignal
Boom! Boom! 2人のAnimal
ナイトプールにピンクのWi‑Fi
Ping! Ping! 心はFly‑High
Splash! Splash! 明日へ続く
ナイトプールにピンクのWi‑Fi

Baby, forever Wi‑Fi`,
    art: {
      c1: '#3ea9ee',
      c2: '#1c5cbc',
      glow: '#95d0f6',
      initials: 'SS',
      image: splashSignalCover,
    },
  },
  {
    id: 'cotton-candy-hip-drop',
    title: 'コットンキャンディーヒップドロップ',
    sub: 'TRK 05',
    date: '2026.01.04',
    durationLabel: '2:27',
    src: '/audio/cotton-candy-hip-drop.mp3',
    lyrics: `スウィートなビートで空飛ぶアリバイ
甘くて危ないキャンディーみたい
ぐるぐる回る感情のトップ
とろける瞬間 ヒップでドロップ

パラパラ飴玉　まるでカラフルなアナグラム
ふわふわメンタル　シュガーで満タン
ハートのグラフィティ 混ぜてランダム
響くパルスが踊るリズム
スキップしながらキックにキス
意味はないけど意味深なリップ
キャンディーポップで脳内トリップ

コットンキャンディーヒップドロップ
甘く危ないチップトップ
ゆらゆら揺れてピンと来たら
Drop! Drop! Bounceしてノンストップ
浮かんだ言葉が脈打つCode
弾ける気持ちが導火線Mode
シグナルはCandy-coatedなHop
コットンキャンディーヒップドロップ

低空飛行でも重ねる韻
誘う語感に混じるルイン
Candyに潜む微かな毒
踊る夜　罪のブック
ガムシロップみたいなVoice
割るソーダにハマるChoice
ラップってよりも魔法のJoke
舐めてとろけるHoneyなQuote

コットンキャンディーヒップドロップ
甘く危ないチップトップ
ゆらゆら揺れてピンと来たら
Drop! Drop! Bounceしてノンストップ
泡立つ夢が光るFlash
深く沈むほど跳ねるSplash
きらめく夜に一粒のPop
コットンキャンディーヒップドロップ

チュチュルルChu 甘い罠にCatch
フフフとLaugh 不意にクラッシュ
トキメキ混ぜて練るMy flow
固めた韻で冷やすSnow

コットンキャンディーヒップドロップ
甘く危ないチップトップ
ゆらゆら揺れてピンと来たら
Drop! Drop! Bounceしてノンストップ
浮かんだ言葉が脈打つCode
弾ける気持ちが導火線Mode
シグナルはCandy-coatedなHop
コットンキャンディーヒップドロップ

トロけた夜にそっとKiss
甘く弾けるTwilight bliss`,
    art: {
      c1: '#d2197b',
      c2: '#dc70b2',
      glow: '#e681b6',
      initials: 'CC',
      image: cottonCandyHipDropCover,
    },
  },
  {
    id: 'spin-the-life',
    title: 'SPIN THE LIFE',
    sub: 'TRK 06',
    date: '2026.01.04',
    durationLabel: '2:26',
    src: '/audio/spin-the-life.mp3',
    lyrics: `言葉のサイコロ 転がす度に
止まらないBeat まるで命綱
未来はブラインド 向こう側見えず
でも引いたカードが今を描くよ

踏み出す朝は未だに不確定
頭ん中じゃ千通りの選定
汗と運命 握って勝負
確証ないけど 心はオールイン
記憶の街角 すり減る靴底
夢の断片にしがみつく動機
一か八かなんて言わないが
確率論より自分を信じたい

誰もがSpinしてるこのLife
ルーレットの音が響くNight
選ぶだけじゃ始まらない
ShakeしてThrow ほら出番じゃない？
時間は賭け金 でも返金なし
なら踊るだけ 無駄なんてなし
「どうせなら」より「今こそ」がKey
All In, Baby 全部賭けてみ

タイトに走るRhythmの波
感覚任せ 転がるサイ
いつだって選ぶMy turn
逃げても意味ないRound
秒針がBurn
ステージは静かに狂ったDice
誰もが笑ってる裏でCry
だけど自分の声に賭ける
道は一本じゃなくてもイケる

誰もがSpinしてるこのLife
ルーレットの音が響くNight
選ぶだけじゃ始まらない
ShakeしてThrow ほら出番じゃない？
時間は賭け金 でも返金なし
なら踊るだけ 無駄なんてなし
「どうせなら」より「今こそ」がKey
All In, Baby 全部賭けてみ

遠回りして届いた今
選択肢より選んだ意味が
過去のノイズ消してくBeat
張ったフリじゃなく これがReal
人生ゲームにルールはねえ
勝者敗者は後で変わるぜ
引いた札がどんなでも
揺るがぬ芯で賭けるっての

1秒で変わる世界
その1秒で何を掴むか
心がバグっても進む
言葉が光れば道になる

誰もがSpinしてるこのLife
ルーレットの音が響くNight
選ぶだけじゃ始まらない
ShakeしてThrow ほら出番じゃない？
時間は賭け金 でも返金なし
なら踊るだけ 無駄なんてなし
「どうせなら」より「今こそ」がKey
All In, Baby 全部賭けてみ

Fade死なない 必然の声
響け この場面に全て込めて`,
    art: {
      c1: '#1b33e2',
      c2: '#6c74f4',
      glow: '#828fef',
      initials: 'ST',
      image: spinTheLifeCover,
    },
  },
  {
    id: 'nyant-stop-me',
    title: 'Nyan’t Stop Me',
    sub: 'TRK 07',
    date: '2025.12.20',
    durationLabel: '2:54',
    src: '/audio/nyant-stop-me.mp3',
    lyrics: `I said no, but now I’m here
Ears on high, can’t disappear
I look away, but still I stay
What is this game we're forced to play?

Heart goes bump, tail goes sway
Feel so weird, but I obey
Just a dare? Or just a play?
Can’t tell night from neon day

nya nya nya

Wired ears and glitchy beats
I hate it, but it kinda fits
Laugh it off, then turn around
Maybe I like this silly sound

nya nya nya

You call me cute, I roll my eyes
But deep inside, a spark ignites
Try to hide but I confess
Maybe I'm enjoying this mess

nya nya nya

Don't touch the ears…
Unless you mean it…

nya nya nya

Nya! Nya! Nya! Nya!
Let it go — with a nyan!
Jumpin’ high, feel the spark
Burn it loud with a mark!`,
    art: {
      c1: '#ffb5dd',
      c2: '#71538c',
      glow: '#ffd6ec',
      initials: 'NS',
      image: nyantStopMeCover,
    },
  },
  {
    id: 'dennou-translate',
    title: '電脳トランスレイト',
    sub: 'TRK 08',
    date: '2025.12.20',
    durationLabel: '2:42',
    src: '/audio/dennou-translate.mp3',
    lyrics: `Midnight signal calling me
キミの声が glitchyに
“会いたい” just won’t translate
エモすぎる late update

Binary code 書き換えて
心の中入ってきて
Emotions drift on pixel tide
トキメキが overflow

Cyber kissで kissで　繋がって
Neon heart, can’t disconnect
涙の代わりにbeat
キミとsyncしたいだけ

Glitchな夜に　夜に　落ちていく
Loopされた“好き”が痛い
このfeelingは fakeじゃない
I wanna live inside your line

Half-Englishな whisper
やさしくて消えそうで
記憶の中、キミだけ
Japanese spark in my delay

Uninstallしないで
この想いdeleteしないで
Underneath this candy skin
壊れてもいいから

Cyber kissで　kissで　繋がって
Neon heart, can’t disconnect
涙の代わりにbeat
キミとsyncしたいだけ

Glitchな夜に落ちていく
Loopされた“好き”が痛い
このfeelingは fakeじゃない
I wanna live inside your line

トランスして…
rewrite me softly...`,
    art: {
      c1: '#3c5dce',
      c2: '#b26cf0',
      glow: '#94a6e4',
      initials: '電脳',
      image: dennouTranslateCover,
    },
  },
  {
    id: 'fukuoka-teppanyaki',
    title: 'Fukuoka Teppanyaki',
    sub: 'TRK 09',
    date: '2025.12.20',
    durationLabel: '2:31',
    src: '/audio/fukuoka-teppanyaki.mp3',
    lyrics: `Headed to the station
The city's dressed in neon and bright
And I hear a voice callin' my name
I think it sounds like you
He says
"Are you new here?"
He looks me up and down
And he gives me a smile
Says
"I think I can show you around"

Cause
Honey
We're not done
Until the morning sun
So baby
Come on

If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki

I can feel the night air
The wind blowin' my hair
And I breathe it all in
I don't know how this night could be better
Baby
If you don't mind
Let's put the rest behind
And focus on us
We'll have a night that we won't forget

Cause
Honey
We're not done
Until the morning sun
So baby
Come on

If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki

If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki
If you love me
Take me to the teppanyaki
Take me to the teppanyaki`,
    art: {
      c1: '#d3be62',
      c2: '#a44836',
      glow: '#e7dba9',
      initials: 'FT',
      image: fukuokaTeppanyakiCover,
    },
  },
  {
    id: 'love-dynamite',
    title: 'Love dynamite',
    sub: 'TRK 10',
    date: '2025.12.16',
    durationLabel: '3:29',
    src: '/audio/love-dynamite.mp3',
    lyrics: `ねぇ既読無視の意味教えて
一分一秒心臓ドクドク
誰より好きな君だから
思考停止エンドレスリピート

寝ても覚めても君のことで
世界の全部色変わる
友達にはもう戻れない
ずっと前から本気なんだ

スキが爆発しちゃいそう
抑えきれないこの衝動
「君じゃなきゃ無理！」って叫ぶの
この恋に迷いなんてないの

君の好きな服に着替えて
偶然装って近づくの
ちょっと怖いって思うかもね
でも愛は深いほうがいいでしょ？

誰かに渡す気なんてない
独り占めするのがルール
“病んでる”って言われたとしても
愛ってそういうものでしょ？

スキが確信犯レベルで
重いなんて気にしないで
君の世界を塗り替える
ねぇ私だけを見ていて

スキが爆発止まらない
君の名前を毎晩コール
「運命だよ」って目を見て
この恋、永遠にしてあげる`,
    art: {
      c1: '#8db5f8',
      c2: '#f7938e',
      glow: '#c0d6fb',
      initials: 'LD',
      image: loveDynamiteCover,
    },
  },
];
