"""ソース(panels.ts / labelFonts.ts)を「唯一の真実」として機械パースするヘルパ。

このモジュールは *テストにパネル定義やフォント登録名をハードコードしない* ための要。
将来 displayLabel やフォントが増減しても、ここが panels.ts / labelFonts.ts を
読み直すのでテスト側の変更は不要。

パースは正規表現ベース(TS を実行せず、静的にトークンを拾う)。対象 TS の
記法が大きく変わったらここだけ直せばよい。パースに失敗したら黙って空を返さず
例外にする(= テストが「対象を読めていない」ことに気づけるようにする)。
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

# tests/font_audit/sources.py → リポジトリルートは 2 つ上。
REPO_ROOT = Path(__file__).resolve().parents[2]
PANELS_TS = REPO_ROOT / "src" / "data" / "panels.ts"
LABEL_FONTS_TS = REPO_ROOT / "src" / "three" / "hud" / "labelFonts.ts"
INDEX_CSS = REPO_ROOT / "src" / "index.css"
FONTS_DIR = REPO_ROOT / "src" / "assets" / "fonts"
DIST_ASSETS = REPO_ROOT / "dist" / "assets"


@dataclass(frozen=True)
class FontBinding:
    """フォントキー(dela/wdxl 等)と、その登録ファミリ名・woff2 実ファイルの対応。

    - key:            panels.ts の labelFont 値(= LABEL_FONTS のキー)。
    - family:         FontFace/CSS 登録ファミリ名(labelFonts.ts の FACES.family)。
    - woff2_filename: src/assets/fonts 配下のサブセット woff2 ファイル名。
    - required_chars: このフォントが担当する全 displayLabel の必要文字(空白除く)。
    """

    key: str
    family: str
    woff2_filename: str
    required_chars: frozenset[str]


@dataclass(frozen=True)
class DeliveredFont:
    """dist に woff2 を伴って配信される登録フォント 1 件(配信経路つき)。

    - family:         登録ファミリ名(FontFace 第1引数 / @font-face の font-family)。
    - woff2_filename: src/assets/fonts 配下のソース woff2 ファイル名。
    - route:          'js'  = labelFonts.ts の FontFace 登録(JS バンドルから URL 参照)
                      'css' = index.css の @font-face(CSS バンドルから url() 参照)。
    """

    family: str
    woff2_filename: str
    route: str


def _read(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"パース対象が見つからない: {path}")
    return path.read_text(encoding="utf-8")


# ------------------------------------------------------------------
# panels.ts: displayLabel × labelFont の対応を抽出
# ------------------------------------------------------------------
# 各パネルオブジェクト内の displayLabel と labelFont を拾う。パネルは
#   { id: 'about', ... displayLabel: '小崎 薫', ... labelFont: 'dela' }
# の形。labelFont は任意(未指定 = system フォールバック)なので、
# パネル境界(id: で始まる区切り)ごとにブロックを切って各フィールドを探す。


def _extract_panel_label_map() -> list[tuple[str, str | None]]:
    """panels.ts から [(displayLabel, labelFont|None), ...] を順に返す。

    PANELS 配列の各要素を「id:」出現でブロック分割し、ブロック内の
    displayLabel / labelFont を個別に拾う(フィールド順に依存しない)。
    """
    src = _read(PANELS_TS)

    # PANELS 配列本体だけを対象に絞る(型定義側の displayLabel コメント等を除外)。
    arr = re.search(r"export\s+const\s+PANELS\s*:[^=]*=\s*\[(.*?)\];", src, re.S)
    if not arr:
        raise ValueError("panels.ts: PANELS 配列本体を特定できなかった")
    body = arr.group(1)

    # 「id: '...'」の出現位置でブロック分割(各パネルの先頭マーカ)。
    id_positions = [m.start() for m in re.finditer(r"\bid\s*:\s*['\"]", body)]
    if not id_positions:
        raise ValueError("panels.ts: パネルブロック(id:)が 1 つも見つからない")
    id_positions.append(len(body))

    results: list[tuple[str, str | None]] = []
    for i in range(len(id_positions) - 1):
        block = body[id_positions[i] : id_positions[i + 1]]
        dl = re.search(r"displayLabel\s*:\s*'([^']*)'", block)
        if not dl:
            # displayLabel は全パネル必須。無ければパース崩れなので気づけるよう例外。
            raise ValueError(
                "panels.ts: displayLabel を持たないパネルブロックを検出"
                "(パーサか定義の形が変わった可能性)"
            )
        lf = re.search(r"labelFont\s*:\s*'([^']*)'", block)
        results.append((dl.group(1), lf.group(1) if lf else None))

    return results


# ------------------------------------------------------------------
# labelFonts.ts: フォントキー → (登録ファミリ名, woff2 ファイル名)
# ------------------------------------------------------------------
# 1) import <var> from '<...>/<file>.woff2'  → var:file の対応
# 2) LABEL_FONTS の各キー(dela/wdxl/system)の family 文字列先頭の '…' を登録名候補に
# 3) FACES 配列: { family: '<登録名>', url: <var> } → 登録名:var の対応
# これらを突き合わせて key → (family, file) を作る。


def _extract_import_var_to_file() -> dict[str, str]:
    src = _read(LABEL_FONTS_TS)
    out: dict[str, str] = {}
    for m in re.finditer(
        r"import\s+(\w+)\s+from\s+['\"][^'\"]*/([^'\"/]+\.woff2)['\"]", src
    ):
        out[m.group(1)] = m.group(2)
    if not out:
        raise ValueError("labelFonts.ts: woff2 の import が 1 つも見つからない")
    return out


def _extract_label_font_keys() -> dict[str, str]:
    """LABEL_FONTS の各キー → family 文字列先頭の登録名('…' の中身)。

    例: dela: { family: `'Dela Gothic One', ${FALLBACK}` } → {'dela': 'Dela Gothic One'}
    先頭がクオートで始まらない(= FALLBACK のみの system 等)キーは登録名なしとして除外。
    """
    src = _read(LABEL_FONTS_TS)
    block = re.search(r"LABEL_FONTS\s*:[^=]*=\s*\{(.*?)\n\};", src, re.S)
    if not block:
        raise ValueError("labelFonts.ts: LABEL_FONTS 定義を特定できなかった")
    body = block.group(1)

    out: dict[str, str] = {}
    # key: { family: `'<登録名>', ... 。バッククオート/シングル両対応。
    for m in re.finditer(
        r"(\w+)\s*:\s*\{\s*family\s*:\s*[`'\"]\s*'([^']+)'", body
    ):
        out[m.group(1)] = m.group(2)
    return out


def _extract_faces_family_to_var() -> dict[str, str]:
    src = _read(LABEL_FONTS_TS)
    block = re.search(r"FACES\s*:[^=]*=\s*\[(.*?)\];", src, re.S)
    if not block:
        raise ValueError("labelFonts.ts: FACES 配列を特定できなかった")
    body = block.group(1)
    out: dict[str, str] = {}
    for m in re.finditer(
        r"\{\s*family\s*:\s*'([^']+)'\s*,\s*url\s*:\s*(\w+)\s*\}", body
    ):
        out[m.group(1)] = m.group(2)
    if not out:
        raise ValueError("labelFonts.ts: FACES のエントリを解釈できなかった")
    return out


def font_bindings() -> list[FontBinding]:
    """フォントキー → (family, woff2 ファイル, 必要文字集合) を組み立てて返す。

    「必要文字」は panels.ts の displayLabel を labelFont ごとに集約(空白除く)。
    実 FontFace を持つキー(FACES に登録があり woff2 ファイルが紐づく)だけを対象にする。
    system(フォールバック専用・埋め込みフォントなし)は検証対象外。
    """
    label_map = _extract_panel_label_map()
    key_to_family = _extract_label_font_keys()       # dela -> 'Dela Gothic One'
    family_to_var = _extract_faces_family_to_var()   # 'Dela Gothic One' -> delaUrl
    var_to_file = _extract_import_var_to_file()       # delaUrl -> DelaGothicOne-subset.woff2

    # labelFont 未指定パネルの既定キーを labelFonts.ts から推定せず、
    # 「埋め込みフォントを持つキーのみ検証」という方針にする(未指定 = system = 検証外)。
    # フォントキー別に必要文字を集約。
    chars_by_key: dict[str, set[str]] = {}
    for display_label, label_font in label_map:
        if label_font is None:
            continue  # system フォールバック(埋め込みなし)は網羅対象外
        chars = {c for c in display_label if not c.isspace()}
        chars_by_key.setdefault(label_font, set()).update(chars)

    bindings: list[FontBinding] = []
    for key, needed in sorted(chars_by_key.items()):
        family = key_to_family.get(key)
        if family is None:
            # displayLabel が参照するフォントキーに登録ファミリ名が無い = 定義の不整合。
            raise ValueError(
                f"labelFont='{key}' が panels.ts で使われているが "
                f"LABEL_FONTS に登録ファミリ名がない(定義不整合)"
            )
        var = family_to_var.get(family)
        if var is None:
            raise ValueError(
                f"ファミリ '{family}' が FACES に登録されていない(FontFace 未登録)"
            )
        filename = var_to_file.get(var)
        if filename is None:
            raise ValueError(
                f"FACES の url 変数 '{var}' に対応する woff2 import が無い"
            )
        bindings.append(
            FontBinding(
                key=key,
                family=family,
                woff2_filename=filename,
                required_chars=frozenset(needed),
            )
        )

    if not bindings:
        raise ValueError(
            "検証対象フォントが 0 件。panels.ts に labelFont 付きパネルが無いか、"
            "パースに失敗している"
        )
    return bindings


def registered_families() -> set[str]:
    """FACES に登録された全ファミリ名(family 名整合テスト用)。"""
    return set(_extract_faces_family_to_var().keys())


# ------------------------------------------------------------------
# index.css: @font-face(CSS 経路)の family → woff2 ファイル名
# ------------------------------------------------------------------
# DOM テキスト用フォント(例: 詳細ページ見出しの Dela Gothic One)は JS の
# FontFace ではなく index.css の @font-face で配信される。dist 成果物検査では
# この CSS 経路も「登録フォント」として数える。


def _extract_css_font_face_map() -> dict[str, str]:
    """index.css の @font-face から family → woff2 ファイル名の対応を返す。

    url が .woff2 でないブロックは対象外。@font-face が 1 つも無いのは
    「CSS 経路のフォントが無い構成」として合法(空 dict)だが、ブロックは
    あるのに 1 件も解釈できない場合はパーサ崩れとして例外にする。
    """
    src = _read(INDEX_CSS)
    blocks = re.findall(r"@font-face\s*\{([^}]*)\}", src)
    out: dict[str, str] = {}
    for block in blocks:
        fam = re.search(r"font-family\s*:\s*['\"]([^'\"]+)['\"]", block)
        url = re.search(r"url\(\s*['\"]?([^'\")]+\.woff2)['\"]?\s*\)", block)
        if fam and url:
            out[fam.group(1)] = url.group(1).rsplit("/", 1)[-1]
    if blocks and not out:
        raise ValueError(
            "index.css: @font-face ブロックはあるが family/woff2 URL を解釈できなかった"
            "(記法が変わった可能性。sources.py のパーサを更新してください)"
        )
    return out


def delivered_fonts() -> list[DeliveredFont]:
    """dist に woff2 が出力されるべき登録フォント一覧(JS + CSS の両経路)。

    - JS 経路:  labelFonts.ts の FACES(FontFace 登録)と woff2 import の突き合わせ。
    - CSS 経路: index.css の @font-face(url が .woff2 のもの)。
    dist 成果物検査(観点2/3)の真実源。ラベル用途かどうかは問わない。
    """
    family_to_var = _extract_faces_family_to_var()
    var_to_file = _extract_import_var_to_file()

    fonts: list[DeliveredFont] = []
    for family, var in sorted(family_to_var.items()):
        filename = var_to_file.get(var)
        if filename is None:
            raise ValueError(
                f"FACES の url 変数 '{var}' に対応する woff2 import が無い"
            )
        fonts.append(DeliveredFont(family=family, woff2_filename=filename, route="js"))

    for family, filename in sorted(_extract_css_font_face_map().items()):
        fonts.append(DeliveredFont(family=family, woff2_filename=filename, route="css"))

    if not fonts:
        raise ValueError(
            "配信フォントが 0 件(labelFonts.ts の FACES も index.css の @font-face も空)。"
            "パースに失敗している可能性"
        )
    return fonts
