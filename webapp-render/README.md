# Lattice Studio

一个本地运行的分子与晶体渲染 Web App，支持在本机启动 RDKit 优化服务。

## 使用方式

1. 推荐使用 macOS 的 [start.command](/Users/xiaoyuzhang/Documents/webapp-render/start.command)
2. 或使用 Windows 的 [start.bat](/Users/xiaoyuzhang/Documents/webapp-render/start.bat)
3. 脚本会自动创建项目内虚拟环境，优先使用项目自带离线依赖包安装 `rdkit`，然后打开 `http://127.0.0.1:8765`
4. 也可以直接双击打开 [index.html](/Users/xiaoyuzhang/Documents/webapp-render/index.html)

## 桌面封装

- macOS 构建脚本：[build_mac_app.sh](/Users/xiaoyuzhang/Documents/webapp-render/build_mac_app.sh)
- Windows 构建脚本：[build_windows_exe.bat](/Users/xiaoyuzhang/Documents/webapp-render/build_windows_exe.bat)
- PyInstaller 配置：[lattice_studio.spec](/Users/xiaoyuzhang/Documents/webapp-render/lattice_studio.spec)
- 桌面启动器入口：[desktop_launcher.py](/Users/xiaoyuzhang/Documents/webapp-render/desktop_launcher.py)
- macOS 上运行 `build_mac_app.sh` 后会生成 `dist/Lattice Studio.app`
- Windows 上运行 `build_windows_exe.bat` 后会生成 `dist\\Lattice Studio\\Lattice Studio.exe`
- 由于 `.exe` 不能在 macOS 上直接交叉构建，Windows 可执行文件需要在 Windows 机器上运行一次构建脚本

直接打开 `index.html` 仍可浏览和渲染结构，但小分子优化会优先尝试连接本地 RDKit 服务；若服务未启动，则回退到浏览器内优化。

## 即点即用说明

- 项目已内置 `wheelhouse/` 离线依赖包，当前覆盖：
- macOS Apple Silicon + Python 3.9
- Windows x64 + Python 3.9
- 启动时会优先离线安装，不要求用户先手动安装 RDKit。
- 如果本机 Python 版本或平台和离线包不匹配，启动脚本会自动回退到在线安装。
- 如果你希望做到“连 Python 都不用装”，下一步可以再封装成独立的 `.app` 和 `.exe`。

## 支持格式

- `.mol`
- `.sdf`
- `.xyz`
- `.pdb`
- `.mol2`
- `.cif`

## 已实现功能

- 本地拖拽/选择文件导入
- 多 `data_` block CIF 选择
- 3D 旋转、平移、缩放
- 分子与晶体结构显示
- 晶胞边框显示与超胞复制
- 背景色、投影方式、自动旋转
- 原子尺度、键半径、材质风格、光照风格
- 多种展示样式：`Ball & Stick`、`Licorice`、`PyMOL Premium`、`Editorial Ink`、`Candy Gloss`、`Cartoon Pop`、`Toybox Deluxe`、`Frosted Ghost`、`Crystal Lattice`
- 多套可见差异更强的打光方案：`Studio Soft`、`Northern Sky`、`Museum Black`、`Sunset Rim`、`Blueprint Crisp`
- PNG 与 SVG 双格式导出
- 元素级颜色自定义
- 文件中氢原子的显示/隐藏
- C / N / O / S 的基础自动补氢
- 小分子快速构象优化与恢复原始坐标
- PNG 截图导出
- 本地 RDKit `MMFF/UFF` 小分子优化接口

## 说明

- 该版本基于浏览器端 `3Dmol.js` + 本地 `Python/RDKit` 服务实现。
- 参考了 `/Users/xiaoyuzhang/Downloads/xyzrender-main` 中的文件格式支持范围与“晶体/分子渲染”目标，但前端已重写为更适合本地直接使用的静态工作台。
- 当前“自动补氢”仅面向 C / N / O / S 等常见元素，属于展示级几何补全，不替代专业化学建模与力场优化。
- 当前 CIF 导入会尝试处理多结构 block，并使用更完整的对称装配选项来减少“显示不完整”的情况。
- 小分子优化现在会优先调用本地 RDKit 服务，自动选择 `MMFF94` 或回退到 `UFF`；若服务不可用，则退回浏览器内类力场优化。
- 当前 SVG 导出会尽量遵循当前视角与配色，但不会强行附加额外伪阴影，以保持和 PNG 预览更一致。
