"""観点3: インライン非埋め込みと参照経路。

dist/assets の JS/CSS バンドルに woff2 の data URI が混入していないこと、
および出力された各 woff2 が自分の配信経路のバンドルから URL 参照されている
ことを検証。経路は 2 系統:
  - JS 配信  = labelFonts.ts の woff2 import(FontFace 用)→ JS から参照される
  - CSS 配信 = index.css の @font-face → CSS から url() 参照される
Vite の assetsInlineLimit を woff2 だけ無効化した意図(= 別ファイル配信で
バンドルを肥大化させない)が守られているかの回帰テスト。
未ビルドなら skip(conftest の dist_* fixture)。
"""

from __future__ import annotations

import re

# woff2 を base64 data URI として埋め込む時に現れうる代表的なプレフィックス。
# Vite/各種ツールで MIME 表記が揺れるため複数を張る。
INLINE_MARKERS = (
    "data:font/woff2",
    "data:application/font-woff2",
    "data:application/x-font-woff2",
    "data:font/x-woff2",
)


def test_no_woff2_data_uri_in_bundles(dist_js_files, dist_css_files):
    """どの JS/CSS バンドルにも woff2 の data URI が現れない。"""
    offenders: list[str] = []
    for p in [*dist_js_files, *dist_css_files]:
        text = p.read_text(encoding="utf-8", errors="ignore")
        hits = [m for m in INLINE_MARKERS if m in text]
        if hits:
            offenders.append(f"{p.name}: {', '.join(hits)}")

    assert not offenders, (
        "バンドルに woff2 の data URI が埋め込まれています(別ファイル配信の意図に反する):\n  "
        + "\n  ".join(offenders)
        + "\n→ vite.config.ts の assetsInlineLimit で .woff2 のインライン化が無効か確認してください"
    )


def test_dist_woff2_referenced_from_expected_route(
    dist_woff2_files, dist_js_files, dist_css_files, deliveries
):
    """出力された各 woff2 が、その配信経路のバンドルから URL 参照されている。

    - JS 配信(labelFonts.ts の import → FontFace): ハッシュ付きファイル名が JS 中に現れる。
    - CSS 配信(index.css の @font-face): 同じく CSS 中に url(...) として現れる。
    「別ファイルは出たが誰も参照していない(= 実質未ロード)」と
    「登録フォントに対応しない孤児 woff2」の両方を検出する。
    """
    js_blob = "\n".join(
        p.read_text(encoding="utf-8", errors="ignore") for p in dist_js_files
    )
    css_blob = "\n".join(
        p.read_text(encoding="utf-8", errors="ignore") for p in dist_css_files
    )

    problems: list[str] = []
    accounted: set[str] = set()
    for d in deliveries:
        stem = d.woff2_filename.rsplit(".", 1)[0]
        # Vite の出力名は `<元名>-<ハッシュ>.woff2`(ハッシュ無し構成も許容)。
        pattern = re.compile(rf"^{re.escape(stem)}(-[\w-]+)?\.woff2$")
        dist_matches = [p for p in dist_woff2_files if pattern.match(p.name)]
        if not dist_matches:
            problems.append(
                f"{d.woff2_filename}({d.route} 配信, family='{d.family}'): "
                "dist/assets に対応する woff2 が無い"
            )
            continue
        blob, bundle = (js_blob, "JS") if d.route == "js" else (css_blob, "CSS")
        for p in dist_matches:
            accounted.add(p.name)
            if p.name not in blob:
                problems.append(
                    f"{p.name}: {bundle} バンドルから参照されていない"
                    f"({d.route} 配信のはず。ビルドは通るが実行時に読み込まれない恐れ)"
                )

    for p in dist_woff2_files:
        if p.name not in accounted:
            problems.append(
                f"{p.name}: どの登録フォント(labelFonts.ts / index.css)にも"
                "対応しない孤児 woff2"
            )

    assert not problems, "woff2 の参照経路検査で問題を検出:\n  " + "\n  ".join(problems)
