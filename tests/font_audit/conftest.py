"""共有 fixture: fonttools によるフォント検査と dist 成果物の探索。

方針:
- ネットワークは使わない(fonttools でローカル woff2 を読むだけ)。
- src 側(サブセット網羅性)はビルド不要 = 常に実行できる。
- dist 側(実体/インライン/命名)は `npm run build` 済みの成果物を検査する。
  未ビルドなら *失敗ではなく skip*(ビルド忘れと本当の欠陥を区別する)。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from sources import (
    DIST_ASSETS,
    FONTS_DIR,
    delivered_fonts,
    font_bindings,
    registered_families,
)

# woff2 を読むには brotli 展開が要る。fonttools + brotli が無ければ
# このスイートは意味をなさないので、収集時点で分かるように読み込む。
fontTools_ttLib = pytest.importorskip(
    "fontTools.ttLib",
    reason="fonttools 未導入。tests/font_audit/README.md の venv 手順でインストールしてください",
)
pytest.importorskip(
    "brotli",
    reason="brotli 未導入(woff2 展開に必須)。README の手順で fonttools と一緒に入れてください",
)

from fontTools.ttLib import TTFont  # noqa: E402  (importorskip の後で読む)


# ------------------------------------------------------------------
# ソース由来の fixture(panels.ts / labelFonts.ts が真実源)
# ------------------------------------------------------------------
@pytest.fixture(scope="session")
def bindings():
    """フォントキー → (family, woff2 ファイル, 必要文字集合)。panels.ts / labelFonts.ts 由来。"""
    return font_bindings()


@pytest.fixture(scope="session")
def registered_family_names():
    """labelFonts.ts の FACES に登録された全ファミリ名。"""
    return registered_families()


@pytest.fixture(scope="session")
def deliveries():
    """dist に woff2 が出るべき登録フォント一覧(JS=FontFace / CSS=@font-face の両経路)。

    labelFonts.ts と index.css が真実源。dist 成果物検査(観点2/3)で使う。
    """
    return delivered_fonts()


# ------------------------------------------------------------------
# src 側フォント(サブセット網羅性で読む・ビルド不要)
# ------------------------------------------------------------------
@pytest.fixture(scope="session")
def src_font_path():
    """src/assets/fonts 配下の woff2 実ファイルパスを返すルックアップ関数。"""

    def _lookup(filename: str) -> Path:
        p = FONTS_DIR / filename
        if not p.exists():
            pytest.fail(f"サブセットフォントが存在しない: {p}")
        return p

    return _lookup


# ------------------------------------------------------------------
# dist 側成果物(実体/インライン/命名で読む・ビルド必須)
# ------------------------------------------------------------------
@pytest.fixture(scope="session")
def dist_woff2_files():
    """dist/assets 配下の woff2 ファイル一覧。未ビルドなら skip。"""
    if not DIST_ASSETS.exists():
        pytest.skip(
            f"dist が未生成: {DIST_ASSETS}。`npm run build` 実行後にこのテストは有効になります"
        )
    files = sorted(DIST_ASSETS.glob("*.woff2"))
    if not files:
        pytest.skip(
            "dist/assets に woff2 が無い。`npm run build` を実行してから再度回してください"
        )
    return files


@pytest.fixture(scope="session")
def dist_js_files():
    """dist/assets 配下の JS ファイル一覧(インライン非埋め込み検査用)。未ビルドなら skip。"""
    if not DIST_ASSETS.exists():
        pytest.skip(f"dist が未生成: {DIST_ASSETS}。`npm run build` 後に有効になります")
    files = sorted(DIST_ASSETS.glob("*.js"))
    if not files:
        pytest.skip("dist/assets に JS が無い。`npm run build` を実行してください")
    return files


@pytest.fixture(scope="session")
def dist_css_files():
    """dist/assets 配下の CSS ファイル一覧(CSS 経路の参照検査用)。未ビルドなら skip。

    JS と違い「CSS が 0 個」は CSS 経路フォントが無い構成ではありうるので、
    dist さえあれば空リストも正常として返す(skip しない)。
    """
    if not DIST_ASSETS.exists():
        pytest.skip(f"dist が未生成: {DIST_ASSETS}。`npm run build` 後に有効になります")
    return sorted(DIST_ASSETS.glob("*.css"))


# ------------------------------------------------------------------
# fonttools ヘルパ
# ------------------------------------------------------------------
@pytest.fixture(scope="session")
def cmap_codepoints():
    """woff2 パスを渡すと、その cmap に含まれる Unicode コードポイント集合を返す。"""
    cache: dict[Path, frozenset[int]] = {}

    def _load(path: Path) -> frozenset[int]:
        key = Path(path)
        if key not in cache:
            font = TTFont(str(key))
            cache[key] = frozenset(font.getBestCmap().keys())
        return cache[key]

    return _load


@pytest.fixture(scope="session")
def font_family_name():
    """woff2 パスを渡すと、name table のファミリ名(nameID 16 優先, 無ければ 1)を返す。"""

    def _name(path: Path) -> str | None:
        font = TTFont(str(path))
        name = font["name"]
        # nameID 16 = Typographic Family(推奨)/ 1 = Font Family(必須)。
        return name.getDebugName(16) or name.getDebugName(1)

    return _name
