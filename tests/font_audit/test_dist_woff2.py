"""観点2: dist woff2 実体。

`npm run build` 後、dist/assets に woff2 が「ちょうど登録フォント数ぶん」出力され、
各ファイルが woff2 のマジックナンバ `wOF2` で始まる妥当なバイナリであることを検証。
「登録フォント」は JS 経路(labelFonts.ts の FontFace)と CSS 経路
(index.css の @font-face)の合計(conftest の deliveries fixture)。
未ビルドなら skip(conftest の dist_woff2_files fixture)。
"""

from __future__ import annotations

# woff2 の先頭 4 バイト(署名)。ttf='true'/OTTO, woff='wOFF', woff2='wOF2'。
WOFF2_MAGIC = b"wOF2"


def test_dist_woff2_count_matches_registered_fonts(dist_woff2_files, deliveries):
    """dist の woff2 数が、登録フォント数(JS: FACES + CSS: @font-face の合計)と一致。

    現状は wdxl(JS 配信)と Dela Gothic One(CSS 配信)の 2 つ。数を deliveries
    (labelFonts.ts / index.css のパース結果)から導くのでフォント増減に追随する。
    """
    expected = len({d.woff2_filename for d in deliveries})
    actual = len(dist_woff2_files)
    names = ", ".join(p.name for p in dist_woff2_files)
    assert actual == expected, (
        f"dist/assets の woff2 は {expected} 個であるべきだが {actual} 個: [{names}]。"
        " 少なければ data URI インライン化(vite assetsInlineLimit)を、"
        "多ければ未登録フォントの混入を疑う"
    )


def test_each_dist_woff2_has_valid_magic(dist_woff2_files):
    """各 woff2 ファイルが 'wOF2' 署名で始まる = FontFace として妥当なコンテナ。"""
    for p in dist_woff2_files:
        head = p.read_bytes()[:4]
        assert head == WOFF2_MAGIC, (
            f"{p.name} の先頭 4 バイトが {head!r}(期待: {WOFF2_MAGIC!r})。"
            " woff2 として壊れているか別形式が .woff2 拡張子で出力されている"
        )


def test_dist_woff2_nonempty(dist_woff2_files):
    """空ファイルが混じっていない(署名だけの 0 バイト truncate 等の検出)。"""
    for p in dist_woff2_files:
        size = p.stat().st_size
        assert size > 4, f"{p.name} が小さすぎる({size} バイト)。出力が壊れている可能性"
