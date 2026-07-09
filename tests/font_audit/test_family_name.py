"""観点4: family 名整合。

各ラベルフォント woff2 の name table のファミリ名が、labelFonts.ts の
FontFace 登録名(FACES.family。例: 'WDXL Lubrifont JP N')と一致するか。
不一致だと FontFace(name, url) で登録した名前が実フォントの内部名とズレ、
canvas の font-family 指定でヒットしない/フォールバックする恐れがある。

src 側フォントを読む(ビルド不要)。登録名は labelFonts.ts が真実源。
"""

from __future__ import annotations


def test_woff2_family_matches_registration(bindings, src_font_path, font_family_name):
    """各埋め込みフォントの内部ファミリ名が FACES の登録名と一致する。"""
    mismatches: list[str] = []
    for b in bindings:
        path = src_font_path(b.woff2_filename)
        actual = font_family_name(path)
        if actual != b.family:
            mismatches.append(
                f"{b.woff2_filename}: 内部名={actual!r} / 登録名(labelFonts.ts)={b.family!r}"
            )

    assert not mismatches, (
        "woff2 の内部ファミリ名が FontFace 登録名と一致しません:\n  "
        + "\n  ".join(mismatches)
        + "\n→ 登録名を実フォントに合わせるか、正しい内部名のフォントに差し替えてください"
    )


def test_registered_families_all_have_binding(bindings, registered_family_names):
    """labelFonts.ts の FACES に登録された全ファミリが、実際に検証対象になっている。

    「FACES に登録したが panels.ts のどのラベルからも使われない孤児フォント」を検出。
    ※ 現状の登録は wdxl のみ(全パネルで使用中)。将来未使用登録が増えたら気づける。
    """
    bound_families = {b.family for b in bindings}
    orphans = registered_family_names - bound_families
    assert not orphans, (
        f"FACES に登録されているが panels.ts のどの labelFont からも使われないフォント: "
        f"{sorted(orphans)}(不要登録か、panels.ts 側の割り当て漏れ)"
    )
