# font_audit — フォント成果物の静的監査スイート(pytest)

同梱する自己ホスト Web フォント(サブセット woff2)を、**ビルド成果物とフォント
バイナリの静的検査**に限定して繰り返し検証するための pytest スイート。
3D 描画・WebGL・実行時レンダリングには踏み込まない(dist/ と src/assets/fonts/ だけを見る)。

対象フォントは配信経路の異なる 2 系統:

- **WDXL Lubrifont JP N** — パネル中央の日本語ラベル用。`labelFonts.ts` の
  woff2 import + FontFace API で読み込む(**JS 配信**)。
- **Dela Gothic One** — 詳細ページ見出し(DOM テキスト)用。`src/index.css` の
  `@font-face` で読み込む(**CSS 配信**)。

パネル定義・フォント登録名は **テストにハードコードしない**。`src/data/panels.ts` /
`src/three/hud/labelFonts.ts` / `src/index.css`(@font-face)を機械的にパースして
真実源にするので、将来ラベルやフォントが増減してもテスト側の変更は不要。

## 検証する 4 観点

| # | ファイル | 観点 | ビルド要否 |
|---|---|---|---|
| 1 | `test_subset_coverage.py` | **サブセット網羅性** — 各ラベルフォント(現状 wdxl のみ)が担当 displayLabel の全文字(空白除く)を cmap に持つか。割り当ては `panels.ts` 由来。CSS 配信の Dela(DOM 見出し用)はラベルを持たないため対象外。 | 不要(`src/assets/fonts` を直接読む) |
| 2 | `test_dist_woff2.py` | **dist woff2 実体** — `dist/assets/*.woff2` が登録フォント数(JS の FACES + CSS の @font-face の合計)ぶん出力され、各ファイルが `wOF2` 署名を持つ妥当なバイナリか。 | 要(`npm run build`) |
| 3 | `test_no_inline.py` | **インライン非埋め込みと参照経路** — `dist/assets` の JS/CSS に woff2 の data URI が混入していないか。各 woff2 が配信経路どおり(JS 配信は JS から、CSS 配信は CSS から)参照されているか。孤児 woff2 の検出も兼ねる。 | 要(`npm run build`) |
| 4 | `test_family_name.py` | **family 名整合** — 各ラベルフォント woff2 の name table のファミリ名が `labelFonts.ts` の FontFace 登録名と一致するか。 | 不要(`src/assets/fonts` を直接読む) |

`dist/` が無い(ビルド未実行)場合、観点 2/3 は **失敗ではなく skip** される
(ビルド忘れと本当の欠陥を区別するため)。観点 1/4 はビルド不要なので常に走る。

## 実行手順

すべて `tests/font_audit/` 配下で完結する。**ネットワークは venv 作成時の依存取得のみ**
(取得後はオフラインで再実行可能)。node は `node@22` を使う。

```sh
# 0) (成果物検査 観点2/3 を有効にするなら) 先にビルドしておく
export PATH="/usr/local/opt/node@22/bin:$PATH"
cd /Users/kayu/Projects/claude_code_project/kozakikaoru.github.io
npm run build

# 1) このディレクトリで venv を作成し、依存を入れる(初回のみネット使用)
cd tests/font_audit
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install pytest fonttools brotli   # brotli は woff2 展開に必須

# 2) pytest 実行
./.venv/bin/python -m pytest -v
```

依存は `pytest` / `fonttools` / `brotli` の 3 つだけ。`.venv/` と各種キャッシュは
`.gitignore` 済み(コミット不要)。

## 現在の期待結果(2026-07-09 時点)

ビルド済み・全観点有効の状態で **9 passed(全緑)**。pytest の終了コードは 0。

`dist/` 未生成なら観点 2/3 は skip され、`4 passed / 5 skipped` になる。

## 変更履歴メモ

- **2026-07-09**: 観点 2/3 を「登録フォントは全て JS から参照される」前提から、
  **JS(FontFace)/ CSS(@font-face)の 2 経路**を登録フォントとして数え、
  経路別に参照を検査する方式へ更新。Dela が CSS 配信へ移行した現構成
  (下記)でも意図どおり検証できる。data URI 混入検査も CSS バンドルへ拡張。
- **2026-07-07 時点の意図的 RED**(Dela サブセットの「る」U+308B 欠落)は
  構成変更で解消済み。Dela Gothic One はパネルラベル用途をやめ、詳細ページ
  見出し用として `index.css` の @font-face(`DelaGothicOne-title.woff2`)へ移行。
  パネルラベルは WDXL(`WDXLLubrifontJPN-subset.woff2`)に一本化され、
  観点 1/4 の対象は現状 wdxl のみ。
