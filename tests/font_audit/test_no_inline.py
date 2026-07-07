"""観点3: インライン非埋め込み。

dist/assets の JS バンドルに woff2 の data URI が混入していないことを検証。
Vite の assetsInlineLimit を woff2 だけ無効化した意図(= 別ファイル配信で
JS を肥大化させない)が守られているかの回帰テスト。
未ビルドなら skip(conftest の dist_js_files fixture)。
"""

from __future__ import annotations

# woff2 を base64 data URI として埋め込む時に現れうる代表的なプレフィックス。
# Vite/各種ツールで MIME 表記が揺れるため複数を張る。
INLINE_MARKERS = (
    "data:font/woff2",
    "data:application/font-woff2",
    "data:application/x-font-woff2",
    "data:font/x-woff2",
)


def test_no_woff2_data_uri_in_js(dist_js_files):
    """どの JS チャンクにも woff2 の data URI が現れない。"""
    offenders: list[str] = []
    for p in dist_js_files:
        text = p.read_text(encoding="utf-8", errors="ignore")
        hits = [m for m in INLINE_MARKERS if m in text]
        if hits:
            offenders.append(f"{p.name}: {', '.join(hits)}")

    assert not offenders, (
        "JS バンドルに woff2 の data URI が埋め込まれています(別ファイル配信の意図に反する):\n  "
        + "\n  ".join(offenders)
        + "\n→ vite.config.ts の assetsInlineLimit で .woff2 のインライン化が無効か確認してください"
    )


def test_dist_woff2_referenced_from_js(dist_woff2_files, dist_js_files):
    """出力された各 woff2 ファイル名が、いずれかの JS から URL 参照されている。

    「別ファイルは出たが JS から誰も参照していない(= 実質未ロード)」を防ぐ。
    module URL import なので、JS 中にハッシュ付きファイル名が文字列として現れるはず。
    """
    js_blob = "\n".join(
        p.read_text(encoding="utf-8", errors="ignore") for p in dist_js_files
    )
    unreferenced = [p.name for p in dist_woff2_files if p.name not in js_blob]
    assert not unreferenced, (
        "dist に出力されたが JS から参照されていない woff2 があります: "
        f"{unreferenced}(ビルドは通るが実行時に読み込まれない恐れ)"
    )
