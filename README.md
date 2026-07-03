# 🧪 Lattice Studio

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/python-3.9+-blue.svg" alt="Python 3.9+">
  <img src="https://img.shields.io/badge/platform-macOS%20|%20Windows-lightgrey.svg" alt="Platform: macOS | Windows">
  <img src="https://img.shields.io/badge/rdkit-chem--informatics-green.svg" alt="RDKit">
</p>

<p align="center">
  <b>一个本地运行的分子与晶体渲染工作台，支持直接打开浏览器使用，或连接本地 RDKit 服务进行小分子力场优化。</b>
</p>

<p align="center">
  <i>A local-first molecular & crystal visualization workbench — run in browser or pair with a local RDKit backend for MMFF/UFF optimization.</i>
</p>

---

## ✨ 功能亮点 / Highlights

<table>
<tr>
<td width="50%">

### 🔬 结构渲染
- 12 种渲染样式：Ball & Stick、Licorice、Spacefill、PyMOL Premium、Editorial Ink、Candy Gloss、Cartoon Pop、Toybox Deluxe、Frosted Ghost、Crystal Lattice、Wireframe、Line
- 4 种材质气质：Ceramic、Satin、Glass、Technical
- 5 套光照方案：Studio Soft、Northern Sky、Museum Black、Sunset Rim、Blueprint Crisp
- 透视/正交双投影模式

### 🧬 分子处理
- 自动补氢（C/N/O/S 基础价态）
- 显示/隐藏氢原子
- 小分子快速构象优化（MMFF94/UFF）
- 元素级别颜色自定义

</td>
<td width="50%">

### 💎 晶体支持
- CIF 多 `data_` block 选择
- 晶胞边框与轴向绘制
- 超胞复制（A/B/C 方向 1×–4×）
- 对称装配增强

### 🎨 出图导出
- PNG 截图导出（含阴影与光照）
- SVG 矢量导出
- 统一的投影与阴影算法，出图与预览一致

### ⚡ 即点即用
- 浏览器直接打开 `index.html`，无需安装任何东西
- 可选启动本地 RDKit 优化服务，获得更强的分子优化能力
- 内置离线依赖包，启动时优先离线安装

</td>
</tr>
</table>

---

## 📦 支持格式 / Supported Formats

| 格式 | 扩展名 | 类型 |
|------|--------|------|
| MDL Molfile | `.mol` | 分子 |
| SDF | `.sdf` | 分子（多条目） |
| XYZ | `.xyz` | 分子 |
| PDB | `.pdb` | 分子/蛋白 |
| Mol2 | `.mol2` | 分子 |
| CIF | `.cif` | 晶体 |

---

## 🚀 快速开始 / Quick Start

### 方式一：纯浏览器（零依赖）

直接双击打开 `webapp-render/index.html`，即可浏览和渲染结构。小分子优化会使用浏览器内回退算法。

### 方式二：带 RDKit 后端的完整体验

**macOS：**
```bash
cd webapp-render
./start.command
```

**Windows：**
```bat
cd webapp-render
start.bat
```

脚本会自动：
1. 创建项目内虚拟环境
2. 优先使用项目自带离线依赖包安装 `rdkit`
3. 启动本地服务 → `http://127.0.0.1:8765`
4. 自动打开浏览器

> 💡 小分子优化会优先调用本地 RDKit 服务，自动选择 **MMFF94** 或回退到 **UFF**；若服务不可用，则退回浏览器内优化。

---

## 📁 项目结构 / Project Structure

```
Lattice-studio/
├── README.md                          # 本文件
└── webapp-render/
    ├── index.html                     # 前端主页面
    ├── app.js                         # 前端逻辑 (~100KB)
    ├── styles.css                     # 样式表
    ├── server.py                      # RDKit 优化后端
    ├── desktop_launcher.py            # 桌面封装入口
    ├── bootstrap_env.py               # 环境自举脚本
    ├── requirements.txt               # Python 依赖 (rdkit)
    ├── lattice_studio.spec            # PyInstaller 配置
    ├── start.command                  # macOS 一键启动
    ├── start.bat                      # Windows 一键启动
    ├── build_mac_app.sh               # macOS .app 构建
    ├── build_windows_exe.bat          # Windows .exe 构建
    ├── vendor/
    │   └── 3Dmol-min.js              # 3D 分子渲染库
    ├── wheelhouse/                    # 离线依赖包 (macOS ARM64 + Win x64, Python 3.9)
    └── dist/                          # 构建输出
        ├── Lattice Studio/            # Windows 打包
        └── Lattice Studio.app/        # macOS 打包
```

---

## 🔧 桌面封装 / Desktop Packaging

将 Lattice Studio 打包为独立桌面应用（无需用户安装 Python）：

**macOS：**
```bash
cd webapp-render
./build_mac_app.sh
# 输出 → dist/Lattice Studio.app
```

**Windows：**
```bat
cd webapp-render
build_windows_exe.bat
# 输出 → dist\Lattice Studio\Lattice Studio.exe
```

> ⚠️ Windows `.exe` 需要在 Windows 机器上构建，不能跨平台交叉编译。

---

## 🛠 技术栈 / Tech Stack

| 层 | 技术 |
|----|------|
| 3D 渲染 | [3Dmol.js](https://3dmol.csb.pitt.edu/) |
| 分子优化 | [RDKit](https://www.rdkit.org/) (MMFF94 / UFF) |
| 后端服务 | Python 3.9+ `http.server` |
| 桌面封装 | PyInstaller |
| 画布增强 | Canvas 2D (自定义 AO 阴影 & 光照) |

---

## 📝 说明 / Notes

- 当前"自动补氢"仅面向 C / N / O / S 等常见元素，属于展示级几何补全，不替代专业化学建模与力场优化
- CIF 导入会尝试处理多结构 block，并使用更完整的对称装配选项
- SVG 导出会尽量遵循当前视角与配色，与 PNG 预览保持一致
- 项目内置 `wheelhouse/` 覆盖 **macOS Apple Silicon + Python 3.9** 和 **Windows x64 + Python 3.9**；若平台不匹配，启动脚本会自动回退到在线安装

---

## 📄 License

MIT © [owenxyzhang-seseTJ](https://github.com/owenxyzhang-seseTJ)
