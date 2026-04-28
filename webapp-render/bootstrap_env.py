#!/usr/bin/env python3
from __future__ import annotations

import platform
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WHEELHOUSE = ROOT / "wheelhouse"
OFFLINE_PACKAGES = ["rdkit", "numpy", "Pillow"]


def has_rdkit() -> bool:
    try:
        import rdkit  # noqa: F401
    except ImportError:
        return False
    return True


def wheelhouse_for_current_python() -> Path | None:
    system = platform.system()
    machine = platform.machine().lower()
    version = f"{sys.version_info.major}.{sys.version_info.minor}"

    if version != "3.9":
        return None

    if system == "Darwin" and machine in {"arm64", "aarch64"}:
        return WHEELHOUSE / "macos_arm64"

    if system == "Windows" and machine in {"amd64", "x86_64"}:
        return WHEELHOUSE / "win_amd64"

    return None


def run(cmd: list[str]) -> None:
    print(">", " ".join(cmd))
    subprocess.check_call(cmd)


def install_offline(bundle_dir: Path) -> bool:
    if not bundle_dir.exists():
        return False

    wheels = list(bundle_dir.glob("*.whl"))
    if not wheels:
        return False

    print(f"使用项目内离线依赖包: {bundle_dir}")
    run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--no-index",
            f"--find-links={bundle_dir}",
            *OFFLINE_PACKAGES,
        ]
    )
    return True


def install_online() -> None:
    print("未找到兼容的离线依赖包，回退到在线安装。")
    run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"])
    run([sys.executable, "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")])


def main() -> None:
    if has_rdkit():
        print("RDKit 已可用，跳过依赖安装。")
        return

    bundle_dir = wheelhouse_for_current_python()
    if bundle_dir and install_offline(bundle_dir):
        return

    install_online()


if __name__ == "__main__":
    main()
