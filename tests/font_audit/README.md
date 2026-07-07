# font_audit — フォント成果物の静的監査スイート(pytest)

パネル中央の日本語ラベル用に同梱する自己ホスト Web フォント(サブセット woff2)を、
**ビルド成果物とフォントバイナリの静的検査**に限定して繰り返し検証するための pytest スイート。
3D 描画・WebGL・実行時レンダリングには踏み込まない(dist/ と src/assets/fonts/ だけを見る)。

パネル定義・フォント登録名は **テストにハードコードしない**。`src/data/panels.ts` と
`src/three/hud/labelFonts.ts` を機械的にパースして真実源にするので、
将来ラベルやフォントが増減してもテスト側の変更は不要。

## 検証する 4 観点

| # | ファイル | 観点 | ビルド要否 |
|---|---|---|---|
| 1 | `test_subset_coverage.py` | **サブセット網羅性** — 各フォント(dela/wdxl)が担当 displayLabel の全文字(空白除く)を cmap に持つか。割り当ては `panels.ts` 由来。 | 不要(`src/assets/fonts` を直接読む) |
| 2 | `test_dist_woff2.py` | **dist woff2 実体** — `dist/assets/*.woff2` が登録フォント数ぶん出力され、各ファイルが `wOF2` 署名を持つ妥当なバイナリか。 | 要(`npm run build`) |
| 3 | `test_no_inline.py` | **インライン非埋め込み** — `dist/assets/*.js` に woff2 の data URI が混入していないか。各 woff2 が JS から参照されているか。 | 要(`npm run build`) |
| 4 | `test_family_name.py` | **family 名整合** — 各 woff2 の name table のファミリ名が `labelFonts.ts` の FontFace 登録名と一致するか。 | 不要(`src/assets/fonts` を直接読む) |

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

## 現在の期待結果(2026-07-07 時点)

ビルド済み・全観点有効の状態で **8 passed / 1 failed**。唯一の失敗は
`test_subset_coverage.py::test_subset_covers_required_chars` で、これは
**既知のフォント欠陥を検出する意図的な RED**(下記)。pytest の終了コードは 1 になる。

```
test_subset_coverage.py::test_subset_covers_required_chars FAILED
E   Failed: サブセットに担当ラベルの文字が欠落しています:
E     - dela (DelaGothicOne-subset.woff2, family='Dela Gothic One'): 欠落 'る' U+308B
```

`dist/` 未生成なら観点 2/3 は skip され、`1 failed / 3 passed / 5 skipped` になる。

---

## engineer 向け: この RED を GREEN にする修正提案

### 症状
`src/assets/fonts/DelaGothicOne-subset.woff2` の cmap が **「る」(U+308B) を欠く**。
Dela を使う services パネルの `displayLabel = 'お力になれること'` は
れ(U+308C)と る(U+308B)の両方を含むが、サブセットには れ しか無い。

### 影響
family スタックに `'Hiragino Sans',…` フォールバックがあるため豆腐(□)にはならず、
「る」だけシステムフォントで描画される → services ラベルが **7 文字 Dela + 1 文字システムの混植**
になり、A/B 比較の見た目が崩れる(クラッシュはしない)。

### 原因
両サブセットとも同一の 20 文字(+空白)で生成されているが、その集合が
全 displayLabel の union(21 文字)から「る」を取りこぼしている。
無関係な「わ」(contact 用)は含まれているので、サブセット生成時の文字集合のズレ。

### 修正
`DelaGothicOne-subset.woff2` を **「る」を含めて再生成**する。安全のため両フォントとも
「全 displayLabel の union 文字」で subset し直すのが望ましい。この union は本スイートの
パーサが算出しているので、再生成スクリプトでも同じロジック(panels.ts の displayLabel を
labelFont ごとに集約)を真実源にすると再発しない。

必要文字(2026-07-07 時点、`sources.py` の算出結果):

- **dela**(about + services): `お こ と な に る れ 力 小 崎 薫`
- **wdxl**(works + career + contact): `い お せ わ 作 例 合 品 問 歴 経`

再生成後に `npm run build` → `pytest` を回し、`test_subset_covers_required_chars` が
PASS(全体 9 passed)になれば完了。

> 恒久対策(任意): subset 対象文字を `panels.ts` の displayLabel から自動導出する
> 生成スクリプトにすると、ラベル追加時の「サブセット取りこぼし」を構造的に防げる。
