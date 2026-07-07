"""観点1: サブセット網羅性。

各埋め込みフォント(dela/wdxl)が、自分の担当する全 displayLabel の文字
(空白除く)を cmap に持つかを検証する。フォント→必要文字の割り当ては
panels.ts を真実源にして sources.py が導出する(テストにハードコードしない)。

【重要】現状は Dela サブセットが「る」(U+308B)を欠くため、services パネルの
'お力になれること' が満たせず、このテストは *意図的に RED* になる。
GREEN 化はフォント再生成で行う(README の engineer 向け提案を参照)。
ビルド不要(src/assets/fonts を直接読む)なので常に実行される。
"""

from __future__ import annotations

import pytest


def _missing(required: frozenset[str], codepoints: frozenset[int]) -> list[str]:
    """必要文字のうち cmap に無いものを、コードポイント順で返す。"""
    return [ch for ch in sorted(required) if ord(ch) not in codepoints]


def test_bindings_discovered(bindings):
    """まず前提: panels.ts / labelFonts.ts から検証対象フォントを 1 つ以上抽出できること。"""
    assert bindings, "検証対象フォントが抽出できていない(パース不全の可能性)"
    for b in bindings:
        assert b.required_chars, f"{b.key}: 必要文字集合が空(displayLabel 抽出に失敗?)"


def test_subset_covers_required_chars(bindings, src_font_path, cmap_codepoints):
    """各フォントの cmap が担当ラベルの全文字を含む(1 文字でも欠ければ FAIL)。

    パラメータ化せず 1 テストで全フォントを走査し、欠落を全部集めてから
    まとめて assert する。→ どのフォントの何文字が欠けているか一望できる。
    """
    report: dict[str, list[str]] = {}
    for b in bindings:
        path = src_font_path(b.woff2_filename)
        codepoints = cmap_codepoints(path)
        miss = _missing(b.required_chars, codepoints)
        if miss:
            report[f"{b.key} ({b.woff2_filename}, family='{b.family}')"] = miss

    if report:
        lines = ["サブセットに担当ラベルの文字が欠落しています:"]
        for who, chars in report.items():
            pretty = ", ".join(f"'{c}' U+{ord(c):04X}" for c in chars)
            lines.append(f"  - {who}: 欠落 {pretty}")
        lines.append(
            "\n→ 該当サブセット woff2 を、全 displayLabel の union 文字で再生成してください。"
        )
        pytest.fail("\n".join(lines))
