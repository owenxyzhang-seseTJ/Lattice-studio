# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path
import sys

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules


ROOT = Path.cwd()
rdkit_datas = collect_data_files("rdkit")
rdkit_bins = collect_dynamic_libs("rdkit")
rdkit_hiddenimports = collect_submodules("rdkit")

datas = [
    (str(ROOT / "index.html"), "."),
    (str(ROOT / "styles.css"), "."),
    (str(ROOT / "app.js"), "."),
    (str(ROOT / "vendor"), "vendor"),
]
datas += rdkit_datas

a = Analysis(
    ["desktop_launcher.py"],
    pathex=[str(ROOT)],
    binaries=rdkit_bins,
    datas=datas,
    hiddenimports=rdkit_hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Lattice Studio",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="Lattice Studio",
)

if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="Lattice Studio.app",
        icon=None,
        bundle_identifier="com.codex.latticestudio",
    )
