const SAMPLE_STRUCTURES = {
  benzene: {
    name: "Benzene.mol",
    format: "sdf",
    text: `Untitled ACS Document 1996-1.mol
  ChemDraw04182622082D

  0  0  0     0  0              0 V3000
M  V30 BEGIN CTAB
M  V30 COUNTS 6 6 0 0 0
M  V30 BEGIN ATOM
M  V30 1 C -0.714471 0.412500 0.000000 0
M  V30 2 C -0.714471 -0.412500 0.000000 0
M  V30 3 C 0.000000 -0.825000 0.000000 0
M  V30 4 C 0.714471 -0.412500 0.000000 0
M  V30 5 C 0.714471 0.412500 0.000000 0
M  V30 6 C 0.000000 0.825000 0.000000 0
M  V30 END ATOM
M  V30 BEGIN BOND
M  V30 1 2 1 2
M  V30 2 1 2 3
M  V30 3 2 3 4
M  V30 4 1 4 5
M  V30 5 2 5 6
M  V30 6 1 6 1
M  V30 END BOND
M  V30 END CTAB
M  END`,
  },
  water: {
    name: "Water.xyz",
    format: "xyz",
    text: `3
Water
O 0.0000 0.0000 0.0000
H 0.7586 0.0000 0.5043
H -0.7586 0.0000 0.5043`,
  },
  nacl: {
    name: "NaCl.cif",
    format: "cif",
    text: `data_NaCl
_symmetry_space_group_name_H-M 'P 1'
_cell_length_a 5.6400
_cell_length_b 5.6400
_cell_length_c 5.6400
_cell_angle_alpha 90
_cell_angle_beta 90
_cell_angle_gamma 90

loop_
_space_group_symop_id
_space_group_symop_operation_xyz
1 x,y,z

loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
Na1 Na 0.0000 0.0000 0.0000
Cl1 Cl 0.5000 0.5000 0.5000`,
  },
};

const DEFAULT_COLORS = {
  H: "#e3ebf4",
  C: "#919191",
  N: "#ababe0",
  O: "#df5e5e",
  F: "#a7d16e",
  P: "#ff9a3d",
  S: "#f6bf52",
  Cl: "#34c759",
  Br: "#c46b39",
  I: "#8d68e8",
};

const METAL_DEFAULT_COLOR = "#167a9e";

const COVALENT_RADII = {
  H: 0.31,
  B: 0.85,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  Si: 1.11,
  P: 1.07,
  S: 1.05,
  Cl: 1.02,
  Br: 1.2,
  I: 1.39,
};

const state = {
  baseFileName: "Benzene.mol",
  originalText: "",
  rawText: "",
  format: "sdf",
  fileName: "Benzene.mol",
  isCrystal: false,
  currentElements: [],
  elementColors: {},
  atomCount: 0,
  coordinateOverrides: null,
  baseModel: null,
  optimizationSummary: "原始导入坐标",
  optimizationRunning: false,
  generatedHydrogenCount: 0,
  cifBlocks: [],
  selectedCifBlock: 0,
  crystalCell: null,
  renderAtomCount: 0,
  sourceAtomCount: 0,
  sceneVersion: 0,
  illustrationSignature: "",
};

const controls = {};
let viewer;

const METAL_ELEMENTS = new Set([
  "Li", "Na", "K", "Rb", "Cs", "Fr", "Be", "Mg", "Ca", "Sr", "Ba", "Ra",
  "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Y", "Zr", "Nb",
  "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "Hf", "Ta", "W", "Re", "Os", "Ir",
  "Pt", "Au", "Hg", "Al", "Ga", "In", "Sn", "Tl", "Pb", "Bi", "La", "Ce", "Pr",
  "Nd", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
]);

const STYLE_HINTS = {
  "ball-stick": "平衡科研可读性和视觉层次的经典球棍样式。",
  sticks: "更偏科研软件常用的棍状表示，适合看连接关系。",
  licorice: "更浓更厚的棒棒糖质感，适合做深色或高级展示图。",
  "pymol-premium": "偏 PyMOL / 论文插图的精致球棍风格，适合科研出图。",
  "editorial-ink": "像杂志信息图一样克制、清晰，适合做示意图和封面风。",
  spacefill: "强调体积与占据空间，适合观察堆积与孔道遮挡。",
  candy: "高饱和糖果感配色，适合演示和更卡通的视觉表达。",
  "cartoon-pop": "更圆润、更柔和、更像插画玩具的卡通分子风格。",
  toybox: "更夸张、更像手办模型的玩具风格，适合展示和演示。",
  ghost: "半透明磨砂玻璃效果，适合叠加结构或观察内部关系。",
  "crystal-lattice": "更适合 MOF 和晶体框架，突出节点与骨架节奏。",
  wire: "轻量线框和小节点，适合快速浏览大结构。",
  line: "最简洁的示意视图，适合配合轮廓光使用。",
};

const LIGHT_HINTS = {
  studio: "冷白棚拍风格，适合大多数分子与晶体模型。",
  northern: "更偏冷色天空光，层次更通透，适合无机结构和晶体。",
  museum: "深色展厅打光，轮廓和主体对比最强，适合出图。",
  sunset: "暖色边缘光，更有氛围感，适合展示型画面。",
  blueprint: "高对比蓝图风，边缘更利落，适合技术示意和封面感。",
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(message) {
  $("statusText").textContent = message;
}

function setRangeValue(id, value) {
  const numericValue = Number(value);
  if (id === "optimizeStepsValue") {
    $(id).textContent = String(Math.round(numericValue));
    return;
  }
  $(id).textContent = numericValue.toFixed(id === "aoRadiusValue" ? 1 : 2).replace(/\.00$/, "");
}

function inferFormat(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "mol" || ext === "sdf") return "sdf";
  if (ext === "cif") return "cif";
  if (ext === "xyz") return "xyz";
  if (ext === "pdb") return "pdb";
  if (ext === "mol2") return "mol2";
  throw new Error(`暂不支持的文件格式: .${ext}`);
}

function detectCrystal(format, text) {
  if (format === "cif") return true;
  return /_cell_length_a|Lattice\s*=|CRYST1/.test(text);
}

function parseCellNumber(token) {
  if (token === undefined || token === null) return null;
  const cleaned = String(token).replace(/["']/g, "").replace(/\(.*/, "").trim();
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function getCellVectorsFromParameters(a, b, c, alpha, beta, gamma) {
  const alphaRad = alpha * Math.PI / 180;
  const betaRad = beta * Math.PI / 180;
  const gammaRad = gamma * Math.PI / 180;
  const sinGamma = Math.sin(gammaRad) || 1e-6;

  const vectorA = { x: a, y: 0, z: 0 };
  const vectorB = {
    x: b * Math.cos(gammaRad),
    y: b * sinGamma,
    z: 0,
  };
  const cx = c * Math.cos(betaRad);
  const cy = c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / sinGamma;
  const czSquared = Math.max(0, c * c - cx * cx - cy * cy);
  const vectorC = {
    x: cx,
    y: cy,
    z: Math.sqrt(czSquared),
  };

  return [vectorA, vectorB, vectorC];
}

function parseCrystalCell(format, text) {
  let a = null;
  let b = null;
  let c = null;
  let alpha = null;
  let beta = null;
  let gamma = null;

  if (!text) return null;

  if (format === "cif" || /_cell_length_a|_cell_angle_alpha/.test(text)) {
    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const parts = trimmed.split(/\s+/);
      const key = parts[0];
      const value = parseCellNumber(parts[1]);
      if (value === null) return;
      if (key === "_cell_length_a") a = value;
      if (key === "_cell_length_b") b = value;
      if (key === "_cell_length_c") c = value;
      if (key === "_cell_angle_alpha") alpha = value;
      if (key === "_cell_angle_beta") beta = value;
      if (key === "_cell_angle_gamma") gamma = value;
    });
  }

  if (![a, b, c, alpha, beta, gamma].every((value) => Number.isFinite(value))) {
    const cryst1Match = text.match(
      /^CRYST1\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/m,
    );
    if (cryst1Match) {
      a = parseCellNumber(cryst1Match[1]);
      b = parseCellNumber(cryst1Match[2]);
      c = parseCellNumber(cryst1Match[3]);
      alpha = parseCellNumber(cryst1Match[4]);
      beta = parseCellNumber(cryst1Match[5]);
      gamma = parseCellNumber(cryst1Match[6]);
    }
  }

  if (![a, b, c, alpha, beta, gamma].every((value) => Number.isFinite(value))) {
    return null;
  }

  return {
    a,
    b,
    c,
    alpha,
    beta,
    gamma,
    vectors: getCellVectorsFromParameters(a, b, c, alpha, beta, gamma),
  };
}

function splitCifBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^data_/i.test(trimmed)) {
      if (current && current.lines.length) {
        blocks.push({
          name: current.name,
          text: current.lines.join("\n"),
        });
      }

      current = {
        name: trimmed.replace(/^data_/i, "") || `block-${blocks.length + 1}`,
        lines: [line],
      };
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  if (current && current.lines.length) {
    blocks.push({
      name: current.name,
      text: current.lines.join("\n"),
    });
  }

  return blocks.filter((block) => block.text.trim());
}

function normalizeElement(symbol) {
  if (!symbol) return "";
  const cleaned = String(symbol).replace(/[^A-Za-z]/g, "");
  if (!cleaned) return "";
  return cleaned[0].toUpperCase() + cleaned.slice(1).toLowerCase();
}

function getDefaultColor(element) {
  if (isMetalElement(element)) {
    return METAL_DEFAULT_COLOR;
  }
  return DEFAULT_COLORS[element] || "#8d9bb1";
}

function getCovalentRadius(element) {
  return COVALENT_RADII[element] || 0.82;
}

function getHydrogenBondLength(element) {
  switch (element) {
    case "N":
      return 1.01;
    case "O":
      return 0.98;
    case "S":
      return 1.34;
    case "C":
    default:
      return 1.09;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseHexColor(color) {
  const normalized = color.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function toHexColor({ r, g, b }) {
  const encode = (channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0");
  return `#${encode(r)}${encode(g)}${encode(b)}`;
}

function mixColors(colorA, colorB, ratio = 0.5) {
  const a = parseHexColor(colorA);
  const b = parseHexColor(colorB);
  const weight = clamp(ratio, 0, 1);

  return toHexColor({
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  });
}

function brightenColor(color, ratio) {
  return mixColors(color, "#ffffff", ratio);
}

function deepenColor(color, ratio) {
  return mixColors(color, "#101826", ratio);
}

function withAlpha(color, alpha) {
  const rgb = parseHexColor(color);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

function isMetalElement(element) {
  return METAL_ELEMENTS.has(element);
}

function materialProfile() {
  switch (controls.materialPreset.value) {
    case "glass":
      return { sphereOpacity: 0.58, stickOpacity: 0.46, sphereScale: 1.06 };
    case "satin":
      return { sphereOpacity: 0.9, stickOpacity: 0.78, sphereScale: 1.0 };
    case "technical":
      return { sphereOpacity: 1.0, stickOpacity: 0.92, sphereScale: 0.88 };
    case "ceramic":
    default:
      return { sphereOpacity: 0.98, stickOpacity: 0.9, sphereScale: 1.02 };
  }
}

function updateStyleHint() {
  $("styleHint").textContent = STYLE_HINTS[controls.stylePreset.value] || STYLE_HINTS["ball-stick"];
}

function rotateVectorByQuaternion(vector, quaternion) {
  const x = vector.x;
  const y = vector.y;
  const z = vector.z;
  const qx = quaternion.x;
  const qy = quaternion.y;
  const qz = quaternion.z;
  const qw = quaternion.w;

  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}

function lightingProfile() {
  const strength = Number(controls.aoStrength.value);
  const radius = Number(controls.aoRadius.value);
  const baseColor = controls.backgroundColor.value;
  const frameBlur = 26 + radius * 7;
  const shadowDepth = 16 + strength * 18;
  const outlineWidth = 0.02 + strength * 0.18 + radius * 0.006;

  switch (controls.lightingPreset.value) {
    case "northern":
      return {
        viewStyle: {},
        clearColor: brightenColor(baseColor, 0.04),
        clearAlpha: 0.56,
        stageBackground: `
          radial-gradient(circle at 16% 14%, ${withAlpha("#ecf8ff", 0.95)}, transparent 30%),
          radial-gradient(circle at 84% 18%, ${withAlpha("#d8ecff", 0.92)}, transparent 26%),
          linear-gradient(180deg, ${brightenColor(baseColor, 0.24)} 0%, ${brightenColor(baseColor, 0.08)} 100%)
        `,
        stageOverlay: `
          radial-gradient(circle at 50% 82%, ${withAlpha("#7fb8ff", 0.05 + strength * 0.05)}, transparent ${38 + radius * 2}%),
          linear-gradient(180deg, transparent 0%, ${withAlpha("#b9d6f7", 0.05 + strength * 0.04)} 100%)
        `,
        stageBorder: withAlpha("#b8d2eb", 0.42),
        stageShadow: `inset 0 1px 0 rgba(255,255,255,0.72), 0 ${shadowDepth}px ${frameBlur}px ${withAlpha("#86abd6", 0.08 + strength * 0.08)}`,
        viewerFilter: `drop-shadow(0 ${8 + strength * 4}px ${18 + radius * 2.5}px ${withAlpha("#7ca6d8", 0.08 + strength * 0.08)}) saturate(${1.02 + strength * 0.07}) contrast(${1.01 + strength * 0.05})`,
      };
    case "museum":
      return {
        viewStyle: { style: "outline", width: outlineWidth, color: "#0d1524" },
        clearColor: deepenColor(baseColor, 0.86),
        clearAlpha: 0.72,
        stageBackground: `
          radial-gradient(circle at 50% 14%, ${withAlpha("#44556f", 0.24 + strength * 0.06)}, transparent 28%),
          radial-gradient(circle at 50% 100%, ${withAlpha("#060a11", 0.9)}, transparent 60%),
          linear-gradient(180deg, #182131 0%, #0b111a 46%, #05080e 100%)
        `,
        stageOverlay: `
          radial-gradient(circle at 50% 16%, ${withAlpha("#ffffff", 0.04 + strength * 0.03)}, transparent 22%),
          linear-gradient(180deg, transparent 0%, ${withAlpha("#02050b", 0.2 + strength * 0.12)} 100%)
        `,
        stageBorder: withAlpha("#2b3c55", 0.62),
        stageShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 ${shadowDepth + 12}px ${frameBlur + 18}px ${withAlpha("#02050a", 0.28 + strength * 0.1)}`,
        viewerFilter: `drop-shadow(0 ${12 + strength * 6}px ${24 + radius * 3}px ${withAlpha("#000000", 0.26 + strength * 0.12)}) brightness(${0.98 + strength * 0.06}) contrast(${1.04 + strength * 0.14}) saturate(${1.02 + strength * 0.06})`,
      };
    case "sunset":
      return {
        viewStyle: { style: "outline", width: outlineWidth * 0.72, color: "#fff0dc" },
        clearColor: brightenColor(baseColor, 0.02),
        clearAlpha: 0.5,
        stageBackground: `
          radial-gradient(circle at 18% 18%, ${withAlpha("#ffe5c5", 0.92)}, transparent 28%),
          radial-gradient(circle at 86% 12%, ${withAlpha("#ffd7e2", 0.8)}, transparent 24%),
          linear-gradient(180deg, #fff5ee 0%, ${brightenColor(baseColor, 0.1)} 48%, #f7e1cf 100%)
        `,
        stageOverlay: `
          linear-gradient(180deg, ${withAlpha("#ffffff", 0.02)} 0%, transparent 40%, ${withAlpha("#efb987", 0.08 + strength * 0.06)} 100%),
          radial-gradient(circle at 50% 86%, ${withAlpha("#efb987", 0.06 + strength * 0.05)}, transparent ${36 + radius * 2}%)
        `,
        stageBorder: withAlpha("#f0caa8", 0.56),
        stageShadow: `inset 0 1px 0 rgba(255,255,255,0.62), 0 ${shadowDepth}px ${frameBlur}px ${withAlpha("#d7a27f", 0.12 + strength * 0.08)}`,
        viewerFilter: `drop-shadow(0 ${10 + strength * 5}px ${18 + radius * 2.8}px ${withAlpha("#d39567", 0.12 + strength * 0.09)}) saturate(${1.04 + strength * 0.1}) contrast(${1.02 + strength * 0.06})`,
      };
    case "blueprint":
      return {
        viewStyle: { style: "outline", width: outlineWidth * 1.1, color: "#dff4ff" },
        clearColor: brightenColor(baseColor, 0.12),
        clearAlpha: 0.32,
        stageBackground: `
          radial-gradient(circle at 14% 16%, ${withAlpha("#f4fbff", 0.86)}, transparent 26%),
          linear-gradient(180deg, #e8f5ff 0%, #d7ebfb 100%)
        `,
        stageOverlay: `
          repeating-linear-gradient(0deg, transparent 0 27px, ${withAlpha("#7eb5d7", 0.06 + strength * 0.03)} 27px 28px),
          repeating-linear-gradient(90deg, transparent 0 27px, ${withAlpha("#7eb5d7", 0.06 + strength * 0.03)} 27px 28px),
          linear-gradient(180deg, ${withAlpha("#ffffff", 0.06)} 0%, ${withAlpha("#8cc5e8", 0.04 + strength * 0.03)} 100%)
        `,
        stageBorder: withAlpha("#9ec7e3", 0.56),
        stageShadow: `inset 0 1px 0 rgba(255,255,255,0.78), 0 ${shadowDepth - 2}px ${frameBlur - 2}px ${withAlpha("#8cb6d3", 0.12 + strength * 0.08)}`,
        viewerFilter: `drop-shadow(0 ${7 + strength * 4}px ${16 + radius * 2.4}px ${withAlpha("#86afd0", 0.12 + strength * 0.08)}) contrast(${1.06 + strength * 0.08}) saturate(${1.01 + strength * 0.05})`,
      };
    case "studio":
    default:
      return {
        viewStyle: {},
        clearColor: baseColor,
        clearAlpha: 0.44,
        stageBackground: `
          radial-gradient(circle at 84% 12%, ${withAlpha("#d8e8fb", 0.86)}, transparent 24%),
          radial-gradient(circle at 18% 14%, ${withAlpha("#f9fdff", 0.96)}, transparent 30%),
          linear-gradient(180deg, #fbfdff 0%, ${brightenColor(baseColor, 0.08)} 100%)
        `,
        stageOverlay: `
          linear-gradient(180deg, ${withAlpha("#ffffff", 0.05)} 0%, transparent 36%, ${withAlpha("#b9c9dd", 0.05 + strength * 0.04)} 100%),
          radial-gradient(circle at 50% 82%, ${withAlpha("#8aa5c2", 0.04 + strength * 0.05)}, transparent ${34 + radius * 2}%)
        `,
        stageBorder: withAlpha("#c7d9ea", 0.46),
        stageShadow: `inset 0 1px 0 rgba(255,255,255,0.78), 0 ${shadowDepth}px ${frameBlur}px ${withAlpha("#8ca6c3", 0.1 + strength * 0.08)}`,
        viewerFilter: `drop-shadow(0 ${8 + strength * 4}px ${16 + radius * 2.6}px ${withAlpha("#90aac8", 0.1 + strength * 0.08)}) saturate(${1.01 + strength * 0.05}) contrast(${1 + strength * 0.04})`,
      };
  }
}

function updateLightHint() {
  $("lightHint").textContent = LIGHT_HINTS[controls.lightingPreset.value] || LIGHT_HINTS.studio;
}

function applyLightingRig() {
  const rig = lightingProfile();
  const frame = $("viewer").parentElement;

  frame.style.setProperty("--stage-background", rig.stageBackground);
  frame.style.setProperty("--stage-overlay", rig.stageOverlay);
  frame.style.setProperty("--stage-border", rig.stageBorder);
  frame.style.setProperty("--stage-shadow", rig.stageShadow);
  $("viewer").style.setProperty("--viewer-filter", rig.viewerFilter);
  viewer.setBackgroundColor(rig.clearColor, rig.clearAlpha);
  viewer.setViewStyle(rig.viewStyle || {});
  updateLightHint();
}

function buildStyle(color) {
  const atomScale = Number(controls.atomScale.value);
  const bondRadius = Number(controls.bondRadius.value);
  const profile = materialProfile();
  const styleMode = controls.stylePreset.value;
  const pastelColor = brightenColor(color, 0.26);
  const candyColor = mixColors(brightenColor(color, 0.18), "#ffd7ea", 0.12);
  const ghostColor = brightenColor(color, 0.48);
  const deepColor = deepenColor(color, 0.14);
  const inkColor = deepenColor(color, 0.34);
  const porcelainColor = brightenColor(color, 0.08);
  const toyColor = mixColors(brightenColor(color, 0.12), "#ffe3a8", 0.1);

  if (styleMode === "pymol-premium") {
    return {
      sphere: {
        color: porcelainColor,
        scale: atomScale * 0.82 * profile.sphereScale,
        opacity: 1,
      },
      stick: {
        color: deepenColor(color, 0.06),
        radius: bondRadius * 1.18,
        opacity: 0.98,
      },
    };
  }

  if (styleMode === "editorial-ink") {
    return {
      sphere: {
        color: brightenColor(color, 0.18),
        scale: Math.max(0.16, atomScale * 0.52 * profile.sphereScale),
        opacity: 1,
      },
      stick: {
        color: inkColor,
        radius: Math.max(0.04, bondRadius * 0.88),
        opacity: 0.92,
      },
      line: {
        color: brightenColor(inkColor, 0.12),
        opacity: 0.22,
      },
    };
  }

  if (styleMode === "spacefill") {
    return {
      sphere: {
        color,
        scale: atomScale * 1.18 * profile.sphereScale,
        opacity: profile.sphereOpacity,
      },
    };
  }

  if (styleMode === "sticks") {
    return {
      stick: {
        color,
        radius: bondRadius * 1.08,
        opacity: profile.stickOpacity,
      },
    };
  }

  if (styleMode === "licorice") {
    return {
      stick: {
        color: deepColor,
        radius: bondRadius * 1.35,
        opacity: Math.min(1, profile.stickOpacity + 0.08),
      },
      sphere: {
        color,
        scale: Math.max(0.18, atomScale * 0.22),
        opacity: 1,
      },
    };
  }

  if (styleMode === "candy") {
    return {
      sphere: {
        color: candyColor,
        scale: atomScale * 0.92 * profile.sphereScale,
        opacity: Math.min(1, profile.sphereOpacity),
      },
      stick: {
        color: brightenColor(color, 0.1),
        radius: bondRadius * 1.12,
        opacity: Math.min(1, profile.stickOpacity + 0.04),
      },
    };
  }

  if (styleMode === "cartoon-pop") {
    return {
      sphere: {
        color: pastelColor,
        scale: atomScale * 1.08 * profile.sphereScale,
        opacity: 1,
      },
      stick: {
        color: brightenColor(color, 0.2),
        radius: bondRadius * 1.25,
        opacity: 0.96,
      },
    };
  }

  if (styleMode === "toybox") {
    return {
      sphere: {
        color: toyColor,
        scale: atomScale * 1.18 * profile.sphereScale,
        opacity: 1,
      },
      stick: {
        color: brightenColor(color, 0.16),
        radius: bondRadius * 1.42,
        opacity: 1,
      },
    };
  }

  if (styleMode === "ghost") {
    return {
      sphere: {
        color: ghostColor,
        scale: atomScale * 1.02 * profile.sphereScale,
        opacity: Math.min(0.48, profile.sphereOpacity * 0.62),
      },
      stick: {
        color: brightenColor(color, 0.36),
        radius: bondRadius * 0.96,
        opacity: Math.min(0.34, profile.stickOpacity * 0.5),
      },
    };
  }

  if (styleMode === "crystal-lattice") {
    return {
      sphere: {
        color,
        scale: Math.max(0.16, atomScale * 0.58 * profile.sphereScale),
        opacity: 1,
      },
      stick: {
        color: brightenColor(color, 0.1),
        radius: Math.max(0.045, bondRadius * 0.72),
        opacity: 0.9,
      },
      line: {
        color: brightenColor(color, 0.14),
        opacity: 0.5,
      },
    };
  }

  if (styleMode === "wire") {
    return {
      stick: {
        color,
        radius: Math.max(0.06, bondRadius * 0.55),
        opacity: 0.82,
      },
      sphere: {
        color,
        scale: Math.max(0.16, atomScale * 0.3),
        opacity: 0.98,
      },
    };
  }

  if (styleMode === "line") {
    return {
      line: {
        color,
      },
    };
  }

  return {
    sphere: {
      color,
      scale: atomScale * profile.sphereScale,
      opacity: profile.sphereOpacity,
    },
    stick: {
      color,
      radius: bondRadius,
      opacity: profile.stickOpacity,
    },
  };
}

function renderElementPalette() {
  const palette = $("elementPalette");
  palette.innerHTML = "";

  if (!state.currentElements.length) {
    palette.innerHTML = '<p class="fine-print">当前没有可编辑的元素颜色。</p>';
    return;
  }

  state.currentElements.forEach((element) => {
    const row = document.createElement("label");
    row.className = "element-color-row";

    const tag = document.createElement("span");
    tag.className = "element-color-tag";
    tag.innerHTML = `<span class="element-swatch" style="background:${state.elementColors[element]}"></span>${element}`;

    const input = document.createElement("input");
    input.type = "color";
    input.value = state.elementColors[element];
    input.setAttribute("aria-label", `${element} color`);
    input.addEventListener("input", (event) => {
      state.elementColors[element] = event.target.value;
      renderStructure(false);
    });

    row.append(tag, input);
    palette.appendChild(row);
  });
}

function updateInfo() {
  const displayAtomCount = state.renderAtomCount || state.atomCount;
  $("currentTitle").textContent = state.fileName;
  $("fileNameInfo").textContent = state.fileName;
  $("fileTypeInfo").textContent = state.format === "sdf" ? "SDF / MOL" : state.format.toUpperCase();
  $("elementsInfo").textContent = state.currentElements.join(", ") || "未识别";
  $("formatBadge").textContent = state.format === "sdf" ? "SDF/MOL" : state.format.toUpperCase();
  $("structureBadge").textContent = state.isCrystal ? "Crystal" : "Molecule";
  $("atomCountBadge").textContent = `${displayAtomCount} atoms`;
  $("supercellInfo").textContent = `${controls.supercellA.value} × ${controls.supercellB.value} × ${controls.supercellC.value}`;
  $("conformerInfo").textContent = state.optimizationSummary;
  $("hydrogenInfo").textContent = !controls.autoAddHydrogens.checked
    ? "已关闭自动补氢"
    : state.generatedHydrogenCount > 0
      ? `自动补氢 +${state.generatedHydrogenCount}`
      : "未检测到需补氢位点";
  updateStyleHint();
}

function canOptimizeCurrentStructure() {
  return !state.isCrystal && state.atomCount >= 2 && state.atomCount <= 180 && state.baseModel;
}

function updateOptimizationUI() {
  const canOptimize = canOptimizeCurrentStructure();
  controls.optimizeButton.disabled = state.optimizationRunning || !canOptimize;
  controls.restoreGeometryButton.disabled = state.optimizationRunning || !state.coordinateOverrides;

  if (state.optimizationRunning) {
    controls.optimizeButton.textContent = "优化中...";
    $("optimizeHint").textContent = "正在对小分子执行快速几何松弛，请稍候。";
    return;
  }

  controls.optimizeButton.textContent = "快速优化构象";

  if (state.isCrystal) {
    $("optimizeHint").textContent = "当前载入的是晶体/周期结构。快速优化只针对小分子，不会对 CIF 晶胞启用。";
    return;
  }

  if (state.atomCount > 180) {
    $("optimizeHint").textContent = "当前模型较大。为了保持浏览器内交互流畅，快速优化建议用于 180 个原子以内的小分子。";
    return;
  }

  if (state.atomCount < 2) {
    $("optimizeHint").textContent = "当前结构原子数过少，无法执行构象优化。";
    return;
  }

  $("optimizeHint").textContent = "适用于小分子。会优先尝试连接本地 RDKit 服务执行 MMFF/UFF；若本地服务不可用，则自动回退到浏览器内优化。";
}

function updateCifBlockUI() {
  const blockControl = $("cifBlockControl");
  const select = $("cifBlockSelect");
  select.innerHTML = "";

  if (state.format !== "cif" || state.cifBlocks.length <= 1) {
    blockControl.classList.remove("is-visible");
    return;
  }

  state.cifBlocks.forEach((block, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${block.name}`;
    if (index === state.selectedCifBlock) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  blockControl.classList.add("is-visible");
}

function readModelAtoms(model) {
  const atoms = model.selectedAtoms({});
  const elements = [...new Set(atoms.map((atom) => normalizeElement(atom.elem || atom.atom)))].filter(Boolean).sort();
  state.atomCount = atoms.length;
  state.currentElements = elements;

  elements.forEach((element) => {
    if (!state.elementColors[element]) {
      state.elementColors[element] = getDefaultColor(element);
    }
  });
}

function applyCoordinateOverrides(model) {
  if (!state.coordinateOverrides) return;

  const atomCount = model.selectedAtoms({}).length;
  if (atomCount !== state.coordinateOverrides.length) {
    state.coordinateOverrides = null;
    state.optimizationSummary = "原始导入坐标";
    return;
  }

  model.setCoordinates(state.coordinateOverrides, "array");
}

function getParserOptions() {
  if (state.format === "cif") {
    return {
      keepH: true,
      assignBonds: true,
      doAssembly: true,
      duplicateAssemblyAtoms: true,
      normalizeAssembly: true,
      dontConnectDuplicatedAtoms: false,
    };
  }

  return {
    keepH: true,
    assignBonds: true,
  };
}

function applyHydrogenVisibility() {
  if (controls.showHydrogens.checked) return;

  viewer.setStyle(
    { elem: "H" },
    {
      sphere: { hidden: true },
      stick: { hidden: true },
      line: { hidden: true },
      cross: { hidden: true },
    },
  );
}

function applyUnitCell(model) {
  if (!state.isCrystal || !controls.showUnitCell.checked) return;

  viewer.addUnitCell(model, {
    box: { color: "#8ea1bc", dashed: true, dashLength: 0.18 },
    astyle: { color: "#ff6b6b", radius: 0.06, midpos: -0.7 },
    bstyle: { color: "#57c878", radius: 0.06, midpos: -0.7 },
    cstyle: { color: "#5498ff", radius: 0.06, midpos: -0.7 },
    alabelstyle: {
      fontColor: "#d85a5a",
      showBackground: false,
      inFront: true,
    },
    blabelstyle: {
      fontColor: "#42a65f",
      showBackground: false,
      inFront: true,
    },
    clabelstyle: {
      fontColor: "#487ff1",
      showBackground: false,
      inFront: true,
    },
  });
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length < 1e-8) {
    return { x: 1, y: 0, z: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function addVectors(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subVectors(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scaleVector(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar, z: vector.z * scalar };
}

function crossVectors(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function pickPerpendicular(vector) {
  const reference = Math.abs(vector.x) < 0.8 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  return normalizeVector(crossVectors(vector, reference));
}

function effectiveBondOrder(aElement, bElement, distance, explicitOrder = 1) {
  if (explicitOrder && explicitOrder > 1) return explicitOrder;

  const pair = [aElement, bElement].sort().join("-");

  if (pair === "C-C") {
    if (distance < 1.24) return 3;
    if (distance < 1.42) return 1.5;
    return 1;
  }

  if (pair === "C-N") {
    if (distance < 1.22) return 3;
    if (distance < 1.35) return 2;
    return 1;
  }

  if (pair === "C-O") {
    if (distance < 1.30) return 2;
    return 1;
  }

  if (pair === "N-O") {
    if (distance < 1.25) return 2;
    return 1;
  }

  if (pair === "C-S") {
    if (distance < 1.70) return 2;
    return 1;
  }

  if (pair === "O-S") {
    if (distance < 1.55) return 2;
    return 1;
  }

  return explicitOrder || 1;
}

function computeMissingHydrogenCount(parent, neighbors) {
  const element = normalizeElement(parent.elem || parent.atom);
  if (!["C", "N", "O", "S"].includes(element)) return 0;

  const heavyNeighbors = neighbors.filter((entry) => entry.element !== "H");

  if (["N", "O", "S"].includes(element) && heavyNeighbors.some((entry) => isMetalElement(entry.element))) {
    return 0;
  }

  let targetValence = 0;
  if (element === "C") targetValence = 4;
  if (element === "N") targetValence = 3;
  if (element === "O") targetValence = 2;
  if (element === "S") targetValence = 2;

  let valence = 0;
  neighbors.forEach((entry) => {
    if (isMetalElement(entry.element)) return;
    valence += entry.order;
  });

  if (element === "N" && valence > 3.2) targetValence = 4;
  if (element === "S" && valence > 2.4) return 0;

  if (element === "C" && heavyNeighbors.length >= 3) {
    const heteroHeavyCount = heavyNeighbors.filter((entry) => ["N", "O", "S"].includes(entry.element)).length;
    if (heteroHeavyCount >= 2) {
      return 0;
    }
  }

  return Math.max(0, Math.min(4, Math.floor(targetValence - valence + 0.12)));
}

function generateHydrogenDirections(existingVectors, count) {
  const normalized = existingVectors.map(normalizeVector);

  if (count === 1) {
    const sum = normalized.reduce((acc, vector) => addVectors(acc, vector), { x: 0, y: 0, z: 0 });
    if (Math.hypot(sum.x, sum.y, sum.z) < 1e-6) {
      if (normalized.length >= 2) {
        return [normalizeVector(crossVectors(normalized[0], normalized[1]))];
      }
      return [{ x: 1, y: 0, z: 0 }];
    }
    return [normalizeVector(scaleVector(sum, -1))];
  }

  if (count === 2) {
    if (normalized.length === 0) {
      return [
        normalizeVector({ x: 1, y: 0.35, z: 0.2 }),
        normalizeVector({ x: -1, y: 0.35, z: -0.2 }),
      ];
    }

    if (normalized.length === 1) {
      const base = normalizeVector(scaleVector(normalized[0], -1));
      const perp = pickPerpendicular(base);
      const theta = 70.5 * Math.PI / 180;
      return [
        normalizeVector(addVectors(scaleVector(base, Math.cos(theta)), scaleVector(perp, Math.sin(theta)))),
        normalizeVector(addVectors(scaleVector(base, Math.cos(theta)), scaleVector(perp, -Math.sin(theta)))),
      ];
    }

    const base = normalizeVector(scaleVector(addVectors(normalized[0], normalized[1]), -1));
    const planeNormal = normalizeVector(crossVectors(normalized[0], normalized[1]));
    const perp = Math.hypot(planeNormal.x, planeNormal.y, planeNormal.z) < 1e-6 ? pickPerpendicular(base) : planeNormal;
    const theta = 38 * Math.PI / 180;
    return [
      normalizeVector(addVectors(scaleVector(base, Math.cos(theta)), scaleVector(perp, Math.sin(theta)))),
      normalizeVector(addVectors(scaleVector(base, Math.cos(theta)), scaleVector(perp, -Math.sin(theta)))),
    ];
  }

  if (count === 3) {
    const axis = normalized.length ? normalizeVector(scaleVector(normalized[0], -1)) : { x: 1, y: 0, z: 0 };
    const perpA = pickPerpendicular(axis);
    const perpB = normalizeVector(crossVectors(axis, perpA));
    const theta = 70.5 * Math.PI / 180;

    return [0, 120, 240].map((degrees) => {
      const radians = degrees * Math.PI / 180;
      const ring = addVectors(
        scaleVector(perpA, Math.cos(radians)),
        scaleVector(perpB, Math.sin(radians)),
      );
      return normalizeVector(addVectors(scaleVector(axis, Math.cos(theta)), scaleVector(ring, Math.sin(theta))));
    });
  }

  return [
    normalizeVector({ x: 1, y: 1, z: 1 }),
    normalizeVector({ x: -1, y: -1, z: 1 }),
    normalizeVector({ x: -1, y: 1, z: -1 }),
    normalizeVector({ x: 1, y: -1, z: -1 }),
  ].slice(0, count);
}

function addAutoHydrogens(model, trackState = true) {
  if (!controls.autoAddHydrogens.checked) {
    if (trackState) {
      state.generatedHydrogenCount = 0;
    }
    return;
  }

  const atoms = model.selectedAtoms({});
  const atomMap = new Map();
  const occupiedHydrogenSites = [];
  let maxIndex = atoms.length - 1;

  atoms.forEach((atom, arrayIndex) => {
    const atomIndex = atom.index ?? arrayIndex;
    maxIndex = Math.max(maxIndex, atomIndex);
    atomMap.set(atomIndex, atom);
  });

  const generatedAtoms = [];

  atoms.forEach((atom, arrayIndex) => {
    const element = normalizeElement(atom.elem || atom.atom);
    if (!["C", "N", "O", "S"].includes(element)) return;

    const atomIndex = atom.index ?? arrayIndex;
    const bondRefs = Array.isArray(atom.bonds) ? atom.bonds : [];
    const bondOrders = Array.isArray(atom.bondOrder) ? atom.bondOrder : [];
    const neighbors = [];
    const neighborVectors = [];

    bondRefs.forEach((bondRef, bondIndex) => {
      const neighbor = atomMap.get(bondRef);
      if (!neighbor) return;

      const neighborElement = normalizeElement(neighbor.elem || neighbor.atom);
      const delta = subVectors(neighbor, atom);
      const distance = Math.hypot(delta.x, delta.y, delta.z);
      const effectiveOrder = effectiveBondOrder(
        element,
        neighborElement,
        distance,
        Number(bondOrders[bondIndex] || 1),
      );

      neighbors.push({
        element: neighborElement,
        order: effectiveOrder,
        atom: neighbor,
      });
      neighborVectors.push(delta);

      if (neighborElement === "H") {
        occupiedHydrogenSites.push({ parent: atomIndex, vector: normalizeVector(delta) });
      }
    });

    const missingCount = computeMissingHydrogenCount(atom, neighbors);
    if (!missingCount) return;

    const directions = generateHydrogenDirections(neighborVectors, missingCount);
    const bondLength = getHydrogenBondLength(element);

    directions.forEach((direction) => {
      const unitDirection = normalizeVector(direction);
      const tooCloseToExistingH = occupiedHydrogenSites.some((site) => {
        if (site.parent !== atomIndex) return false;
        const dot = site.vector.x * unitDirection.x + site.vector.y * unitDirection.y + site.vector.z * unitDirection.z;
        return dot > 0.92;
      });

      if (tooCloseToExistingH) return;

      maxIndex += 1;
      const parentBonds = Array.isArray(atom.bonds) ? atom.bonds : [];
      const parentBondOrders = Array.isArray(atom.bondOrder) ? atom.bondOrder : [];
      atom.bonds = parentBonds;
      atom.bondOrder = parentBondOrders;
      atom.bonds.push(maxIndex);
      atom.bondOrder.push(1);

      generatedAtoms.push({
        elem: "H",
        serial: maxIndex + 1,
        index: maxIndex,
        x: atom.x + unitDirection.x * bondLength,
        y: atom.y + unitDirection.y * bondLength,
        z: atom.z + unitDirection.z * bondLength,
        bonds: [atomIndex],
        bondOrder: [1],
      });

      occupiedHydrogenSites.push({ parent: atomIndex, vector: unitDirection });
    });
  });

  if (generatedAtoms.length) {
    model.addAtoms(generatedAtoms);
  }

  if (trackState) {
    state.generatedHydrogenCount = generatedAtoms.length;
  }
}

function applyModelStyles(model) {
  state.currentElements.forEach((element) => {
    model.setStyle({ elem: element }, buildStyle(state.elementColors[element]));
  });
}

function applyHydrogenVisibilityToModel(model) {
  if (controls.showHydrogens.checked) return;

  model.setStyle(
    { elem: "H" },
    {
      sphere: { hidden: true },
      stick: { hidden: true },
      line: { hidden: true },
      cross: { hidden: true },
    },
  );
}

function renderStructure(resetView = true) {
  if (!viewer || !state.rawText) return;

  try {
    viewer.removeAllModels();
    viewer.removeAllShapes();
    viewer.removeAllLabels();
    viewer.removeAllSurfaces();

    viewer.setProjection(controls.projection.value);
    applyLightingRig();

    const model = viewer.addModel(state.rawText, state.format, getParserOptions());
    state.baseModel = model;
    state.sourceAtomCount = model.selectedAtoms({}).length;
    applyCoordinateOverrides(model);

    addAutoHydrogens(model);

    readModelAtoms(model);
    applyModelStyles(model);

    applyHydrogenVisibilityToModel(model);

    if (resetView) {
      viewer.zoomTo();
    }

    viewer.render();
    viewer.resize();
    viewer.spin(Boolean(controls.spinEnabled.checked));

    state.sceneVersion += 1;
    state.illustrationSignature = "";
    renderElementPalette();
    updateInfo();
    updateOptimizationUI();
    renderIllustrationCanvas(true);
  } catch (error) {
    console.error(error);
    setStatus(`解析失败：${error.message}`);
  }
}

function loadStructure(text, format, fileName, sourceLabel) {
  state.baseFileName = fileName;
  state.originalText = text;
  state.format = format;
  state.cifBlocks = format === "cif" ? splitCifBlocks(text) : [];
  state.selectedCifBlock = 0;
  state.rawText = state.cifBlocks.length ? state.cifBlocks[0].text : text;
  state.fileName = state.cifBlocks.length > 1 ? `${fileName} · ${state.cifBlocks[0].name}` : fileName;
  state.isCrystal = detectCrystal(format, state.rawText);
  state.coordinateOverrides = null;
  state.baseModel = null;
  state.sourceAtomCount = 0;
  state.optimizationSummary = "原始导入坐标";
  state.generatedHydrogenCount = 0;
  state.crystalCell = parseCrystalCell(format, state.rawText);
  state.renderAtomCount = 0;
  state.sceneVersion += 1;
  updateCifBlockUI();
  setStatus(sourceLabel);
  renderStructure(true);
}

async function handleFile(file) {
  const format = inferFormat(file.name);
  const text = await file.text();
  loadStructure(text, format, file.name, `已载入 ${file.name}`);
}

function downloadSnapshot() {
  try {
    const canvas = $("illustrationCanvas");
    renderIllustrationCanvas(true);
    const uri = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = uri;
    link.download = `${state.fileName.replace(/\.[^.]+$/, "")}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatus("PNG 已导出");
  } catch (error) {
    console.error(error);
    setStatus(`PNG 导出失败：${error.message}`);
  }
}

function getCurrentViewState() {
  const view = viewer?.getView?.() || [0, 0, 0, 0, 0, 0, 0, 1];
  return {
    modelPosition: {
      x: Number(view[0] || 0),
      y: Number(view[1] || 0),
      z: Number(view[2] || 0),
    },
    distance: Math.max(8, viewer?.getPerceivedDistance?.() || 28),
    quaternion: {
      x: Number(view[4] || 0),
      y: Number(view[5] || 0),
      z: Number(view[6] || 0),
      w: Number(view[7] || 1),
    },
  };
}

function getCurrentQuaternion() {
  return getCurrentViewState().quaternion;
}

function getIllustrationLightRig() {
  const strength = Number(controls.aoStrength.value);
  const radius = Number(controls.aoRadius.value);
  const baseColor = controls.backgroundColor.value;
  const shadowDepth = 0.1 + strength * 0.17;
  const softness = 0.5 + radius * 0.045;

  switch (controls.lightingPreset.value) {
    case "northern":
      return {
        lightVector: normalizeVector({ x: -0.58, y: 0.82, z: 0.64 }),
        ambient: 0.44,
        shadowDepth,
        softness,
        backdropTop: brightenColor(baseColor, 0.18),
        backdropBottom: brightenColor(baseColor, 0.05),
        glowLeft: "#f1fbff",
        glowRight: "#d7ebff",
        cellColor: withAlpha("#8aa8c8", 0.72),
      };
    case "museum":
      return {
        lightVector: normalizeVector({ x: -0.42, y: 0.65, z: 0.52 }),
        ambient: 0.22,
        shadowDepth: shadowDepth + 0.08,
        softness: softness + 0.08,
        backdropTop: deepenColor(baseColor, 0.8),
        backdropBottom: deepenColor(baseColor, 0.92),
        glowLeft: "#4d627c",
        glowRight: "#111a25",
        cellColor: withAlpha("#fff0dc", 0.62),
      };
    case "sunset":
      return {
        lightVector: normalizeVector({ x: -0.7, y: 0.36, z: 0.58 }),
        ambient: 0.34,
        shadowDepth: shadowDepth + 0.03,
        softness,
        backdropTop: brightenColor(baseColor, 0.16),
        backdropBottom: mixColors(baseColor, "#f3d0bb", 0.4),
        glowLeft: "#ffe5cb",
        glowRight: "#ffd6df",
        cellColor: withAlpha("#f0bf9b", 0.72),
      };
    case "blueprint":
      return {
        lightVector: normalizeVector({ x: -0.55, y: 0.76, z: 0.78 }),
        ambient: 0.36,
        shadowDepth: shadowDepth + 0.02,
        softness: softness + 0.04,
        backdropTop: "#edf8ff",
        backdropBottom: "#dbefff",
        glowLeft: "#ffffff",
        glowRight: "#d3ebff",
        cellColor: withAlpha("#76a8ca", 0.8),
      };
    case "studio":
    default:
      return {
        lightVector: normalizeVector({ x: -0.48, y: 0.78, z: 0.72 }),
        ambient: 0.38,
        shadowDepth,
        softness,
        backdropTop: brightenColor(baseColor, 0.12),
        backdropBottom: brightenColor(baseColor, 0.02),
        glowLeft: "#ffffff",
        glowRight: "#dce8fb",
        cellColor: withAlpha("#8ea1bc", 0.72),
      };
  }
}

function getAtomIllustrationProfile(element) {
  const baseColor = state.elementColors[element] || getDefaultColor(element);
  const style = buildStyle(baseColor);
  return {
    element,
    baseColor,
    sphere: style.sphere
      ? {
          color: style.sphere.color || baseColor,
          scale: Number(style.sphere.scale || 0),
          opacity: Number(style.sphere.opacity ?? 1),
        }
      : null,
    stick: style.stick
      ? {
          color: style.stick.color || baseColor,
          radius: Number(style.stick.radius || 0),
          opacity: Number(style.stick.opacity ?? 1),
        }
      : null,
    line: style.line
      ? {
          color: style.line.color || baseColor,
          opacity: Number(style.line.opacity ?? 1),
        }
      : null,
  };
}

function extractRenderableBaseAtoms() {
  if (!state.baseModel) return [];
  const sourceAtoms = state.baseModel.selectedAtoms({});
  return sourceAtoms
    .map((atom, index) => ({
      rawIndex: atom.index ?? index,
      element: normalizeElement(atom.elem || atom.atom),
      x: Number(atom.x || 0),
      y: Number(atom.y || 0),
      z: Number(atom.z || 0),
      bonds: Array.isArray(atom.bonds) ? [...atom.bonds] : [],
      bondOrder: Array.isArray(atom.bondOrder) ? [...atom.bondOrder] : [],
    }))
    .filter((atom) => atom.element && (controls.showHydrogens.checked || atom.element !== "H"));
}

function extractRenderableBaseBonds(baseAtoms) {
  const indexLookup = new Map(baseAtoms.map((atom, index) => [atom.rawIndex, index]));
  const seen = new Set();
  const bonds = [];

  baseAtoms.forEach((atom, atomIndex) => {
    atom.bonds.forEach((ref, bondIndex) => {
      const otherIndex = indexLookup.get(ref);
      if (otherIndex === undefined || otherIndex === atomIndex) return;

      const key = atomIndex < otherIndex ? `${atomIndex}-${otherIndex}` : `${otherIndex}-${atomIndex}`;
      if (seen.has(key)) return;
      seen.add(key);

      bonds.push({
        a: atomIndex,
        b: otherIndex,
        order: Number(atom.bondOrder[bondIndex] || 1),
      });
    });
  });

  return bonds;
}

function fractToCartesian(fract, cell) {
  const [aVector, bVector, cVector] = cell.vectors;
  return addVectors(
    addVectors(scaleVector(aVector, fract[0]), scaleVector(bVector, fract[1])),
    scaleVector(cVector, fract[2]),
  );
}

function buildUnitCellGeometry(cell, repeatA, repeatB, repeatC) {
  const cornerFracts = [
    [0, 0, 0],
    [repeatA, 0, 0],
    [repeatA, repeatB, 0],
    [0, repeatB, 0],
    [0, 0, repeatC],
    [repeatA, 0, repeatC],
    [repeatA, repeatB, repeatC],
    [0, repeatB, repeatC],
  ];
  const corners = cornerFracts.map((fract) => fractToCartesian(fract, cell));
  const edgePairs = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const edges = edgePairs.map(([start, end]) => ({ start: corners[start], end: corners[end] }));
  const axes = [
    { label: "a", color: "#ff6b6b", start: corners[0], end: fractToCartesian([repeatA, 0, 0], cell) },
    { label: "b", color: "#57c878", start: corners[0], end: fractToCartesian([0, repeatB, 0], cell) },
    { label: "c", color: "#5498ff", start: corners[0], end: fractToCartesian([0, 0, repeatC], cell) },
  ];
  return { edges, axes };
}

function buildReplicatedRenderableStructure() {
  const baseAtoms = extractRenderableBaseAtoms();
  if (!baseAtoms.length) {
    return { atoms: [], bonds: [], unitCell: null };
  }

  const baseBonds = extractRenderableBaseBonds(baseAtoms);
  const cell = state.isCrystal ? state.crystalCell : null;
  const repeatA = cell ? Math.max(1, Number(controls.supercellA.value) || 1) : 1;
  const repeatB = cell ? Math.max(1, Number(controls.supercellB.value) || 1) : 1;
  const repeatC = cell ? Math.max(1, Number(controls.supercellC.value) || 1) : 1;
  const atoms = [];
  const bonds = [];

  for (let ia = 0; ia < repeatA; ia += 1) {
    for (let ib = 0; ib < repeatB; ib += 1) {
      for (let ic = 0; ic < repeatC; ic += 1) {
        const offset = cell
          ? fractToCartesian([ia, ib, ic], cell)
          : { x: 0, y: 0, z: 0 };
        const atomIndexMap = new Map();

        baseAtoms.forEach((atom, baseIndex) => {
          const renderIndex = atoms.length;
          atomIndexMap.set(baseIndex, renderIndex);
          atoms.push({
            renderIndex,
            element: atom.element,
            x: atom.x + offset.x,
            y: atom.y + offset.y,
            z: atom.z + offset.z,
            baseColor: state.elementColors[atom.element] || getDefaultColor(atom.element),
          });
        });

        baseBonds.forEach((bond) => {
          bonds.push({
            a: atomIndexMap.get(bond.a),
            b: atomIndexMap.get(bond.b),
            order: bond.order,
          });
        });
      }
    }
  }

  return {
    atoms,
    bonds,
    unitCell: cell && controls.showUnitCell.checked ? buildUnitCellGeometry(cell, repeatA, repeatB, repeatC) : null,
  };
}

function getProjectedPoint(point, viewState, scale, width, height) {
  const transformed = {
    x: point.x + viewState.modelPosition.x,
    y: point.y + viewState.modelPosition.y,
    z: point.z + viewState.modelPosition.z,
  };
  const rotated = rotateVectorByQuaternion(transformed, viewState.quaternion);
  const perspective = controls.projection.value === "perspective"
    ? viewState.distance / Math.max(2.4, viewState.distance - rotated.z)
    : 1;

  return {
    x: width / 2 + rotated.x * scale * perspective,
    y: height / 2 - rotated.y * scale * perspective,
    z: rotated.z,
    perspective,
  };
}

function getBondComponents(order) {
  if (order >= 2.5) return [-1.18, 0, 1.18];
  if (order >= 1.5) return [-0.68, 0.68];
  return [0];
}

function buildIllustrationScene() {
  const structure = buildReplicatedRenderableStructure();
  if (!structure.atoms.length) {
    throw new Error("当前没有可渲染的结构。");
  }

  const width = $("viewer").clientWidth || 1200;
  const height = $("viewer").clientHeight || 860;
  const rig = getIllustrationLightRig();
  const viewState = getCurrentViewState();
  const scale = Math.min(width, height) * 0.84 / viewState.distance;

  const projectedAtomsRaw = structure.atoms.map((atom) => {
    const projected = getProjectedPoint(atom, viewState, scale, width, height);
    const visual = getAtomIllustrationProfile(atom.element);
    const radius = visual.sphere
      ? Math.max(2, getCovalentRadius(atom.element) * visual.sphere.scale * scale * projected.perspective)
      : 0;
    return {
      ...atom,
      ...projected,
      radius,
      visual,
    };
  });

  const atomLookup = new Map(projectedAtomsRaw.map((atom) => [atom.renderIndex, atom]));
  const projectedBonds = structure.bonds
    .map((bond, index) => {
      const atomA = atomLookup.get(bond.a);
      const atomB = atomLookup.get(bond.b);
      if (!atomA || !atomB) return null;

      const dx = atomB.x - atomA.x;
      const dy = atomB.y - atomA.y;
      const length = Math.hypot(dx, dy) || 1;
      const normal = { x: -dy / length, y: dx / length };
      const stickA = atomA.visual.stick;
      const stickB = atomB.visual.stick;
      const hasCylinder = Boolean(stickA || stickB);
      const hasLine = Boolean(atomA.visual.line || atomB.visual.line);
      if (!hasCylinder && !hasLine) return null;
      const widthPx = hasCylinder
        ? Math.max(1.35, ((stickA?.radius || stickB?.radius || Number(controls.bondRadius.value)) * scale) * ((atomA.perspective + atomB.perspective) / 2))
        : Math.max(1.1, Number(controls.bondRadius.value) * scale * 0.55);

      return {
        id: index,
        a: atomA,
        b: atomB,
        order: bond.order,
        mode: hasCylinder ? "cylinder" : "line",
        width: widthPx,
        depth: (atomA.z + atomB.z) / 2,
        normal,
        components: getBondComponents(bond.order),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.depth - right.depth);

  const projectedUnitCell = structure.unitCell
    ? {
        edges: structure.unitCell.edges
          .map((edge) => ({
            start: getProjectedPoint(edge.start, viewState, scale, width, height),
            end: getProjectedPoint(edge.end, viewState, scale, width, height),
          }))
          .sort((left, right) => ((left.start.z + left.end.z) / 2) - ((right.start.z + right.end.z) / 2)),
        axes: structure.unitCell.axes
          .map((axis) => ({
            label: axis.label,
            color: axis.color,
            start: getProjectedPoint(axis.start, viewState, scale, width, height),
            end: getProjectedPoint(axis.end, viewState, scale, width, height),
          }))
          .sort((left, right) => ((left.start.z + left.end.z) / 2) - ((right.start.z + right.end.z) / 2)),
      }
    : null;

  state.renderAtomCount = projectedAtomsRaw.length;

  return {
    width,
    height,
    rig,
    atoms: [...projectedAtomsRaw].sort((left, right) => left.z - right.z),
    bonds: projectedBonds,
    unitCell: projectedUnitCell,
  };
}

function drawIllustrationBackground(ctx, scene) {
  const gradient = ctx.createLinearGradient(0, 0, 0, scene.height);
  gradient.addColorStop(0, scene.rig.backdropTop);
  gradient.addColorStop(1, scene.rig.backdropBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, scene.width, scene.height);

  const leftGlow = ctx.createRadialGradient(scene.width * 0.18, scene.height * 0.16, 0, scene.width * 0.18, scene.height * 0.16, scene.width * 0.42);
  leftGlow.addColorStop(0, withAlpha(scene.rig.glowLeft, 0.52));
  leftGlow.addColorStop(1, withAlpha(scene.rig.glowLeft, 0));
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, scene.width, scene.height);

  const rightGlow = ctx.createRadialGradient(scene.width * 0.84, scene.height * 0.12, 0, scene.width * 0.84, scene.height * 0.12, scene.width * 0.34);
  rightGlow.addColorStop(0, withAlpha(scene.rig.glowRight, 0.42));
  rightGlow.addColorStop(1, withAlpha(scene.rig.glowRight, 0));
  ctx.fillStyle = rightGlow;
  ctx.fillRect(0, 0, scene.width, scene.height);
}

function drawUnitCellCanvas(ctx, scene) {
  if (!scene.unitCell) return;

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineCap = "round";
  ctx.strokeStyle = scene.rig.cellColor;
  ctx.lineWidth = 1.35;
  scene.unitCell.edges.forEach((edge) => {
    ctx.beginPath();
    ctx.moveTo(edge.start.x, edge.start.y);
    ctx.lineTo(edge.end.x, edge.end.y);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.font = '600 14px "Instrument Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  scene.unitCell.axes.forEach((axis) => {
    ctx.strokeStyle = axis.color;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(axis.start.x, axis.start.y);
    ctx.lineTo(axis.end.x, axis.end.y);
    ctx.stroke();
    ctx.fillStyle = axis.color;
    ctx.fillText(axis.label, axis.end.x, axis.end.y);
  });
  ctx.restore();
}

function drawBondCanvas(ctx, bond, rig) {
  const softness = rig.softness;
  const edgeRatio = Math.min(0.38, 0.2 + softness * 0.09);
  const width = bond.mode === "cylinder" ? bond.width : Math.max(1.1, bond.width * 0.8);

  bond.components.forEach((componentOffset) => {
    const offsetX = bond.normal.x * componentOffset * width * 0.9;
    const offsetY = bond.normal.y * componentOffset * width * 0.9;
    const startX = bond.a.x + offsetX;
    const startY = bond.a.y + offsetY;
    const endX = bond.b.x + offsetX;
    const endY = bond.b.y + offsetY;

    const gradient = bond.mode === "cylinder"
      ? ctx.createLinearGradient(
          (startX + endX) / 2 - bond.normal.x * width,
          (startY + endY) / 2 - bond.normal.y * width,
          (startX + endX) / 2 + bond.normal.x * width,
          (startY + endY) / 2 + bond.normal.y * width,
        )
      : ctx.createLinearGradient(startX, startY, endX, endY);

    const edgeA = deepenColor(bond.a.visual.stick?.color || bond.a.visual.baseColor, 0.08 + rig.shadowDepth);
    const edgeB = deepenColor(bond.b.visual.stick?.color || bond.b.visual.baseColor, 0.08 + rig.shadowDepth);
    const coreA = brightenColor(bond.a.visual.stick?.color || bond.a.visual.baseColor, 0.06 + softness * 0.06);
    const coreB = brightenColor(bond.b.visual.stick?.color || bond.b.visual.baseColor, 0.06 + softness * 0.06);

    if (bond.mode === "cylinder") {
      gradient.addColorStop(0, edgeA);
      gradient.addColorStop(edgeRatio, coreA);
      gradient.addColorStop(0.5, brightenColor(mixColors(coreA, coreB, 0.5), 0.18));
      gradient.addColorStop(1 - edgeRatio, coreB);
      gradient.addColorStop(1, edgeB);
    } else {
      gradient.addColorStop(0, coreA);
      gradient.addColorStop(1, coreB);
    }

    ctx.save();
    ctx.globalAlpha = bond.mode === "cylinder"
      ? Math.min(1, ((bond.a.visual.stick?.opacity || 0.94) + (bond.b.visual.stick?.opacity || 0.94)) / 2)
      : Math.min(1, ((bond.a.visual.line?.opacity || 0.94) + (bond.b.visual.line?.opacity || 0.94)) / 2);
    ctx.strokeStyle = gradient;
    ctx.lineCap = "round";
    ctx.lineWidth = width * (bond.components.length > 1 ? 0.84 : 1);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  });
}

function drawAtomCanvas(ctx, atom, rig) {
  if (!atom.visual.sphere || atom.radius <= 0) return;

  const light = rig.lightVector;
  const highlightX = atom.x - light.x * atom.radius * 0.42;
  const highlightY = atom.y - light.y * atom.radius * 0.42;
  const highlightRadius = atom.radius * Math.max(0.12, 0.2 + rig.softness * 0.05);
  const gradient = ctx.createRadialGradient(highlightX, highlightY, highlightRadius, atom.x, atom.y, atom.radius * 1.04);
  const highlight = brightenColor(atom.visual.sphere.color, 0.3 + rig.softness * 0.08);
  const midtone = mixColors(atom.visual.sphere.color, deepenColor(atom.visual.sphere.color, 0.05 + rig.shadowDepth * 0.3), 0.24);
  const edge = deepenColor(atom.visual.sphere.color, 0.12 + rig.shadowDepth);

  gradient.addColorStop(0, highlight);
  gradient.addColorStop(0.42, midtone);
  gradient.addColorStop(1, edge);

  ctx.save();
  ctx.globalAlpha = atom.visual.sphere.opacity;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(0.8, atom.radius * 0.08);
  ctx.strokeStyle = withAlpha(brightenColor(edge, 0.08), 0.82);
  ctx.stroke();
  ctx.restore();
}

function resizeIllustrationCanvas(canvas, width, height) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const targetWidth = Math.round(width * dpr);
  const targetHeight = Math.round(height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function renderIllustrationCanvas(force = false) {
  const canvas = $("illustrationCanvas");
  if (!canvas || !state.baseModel) return;

  try {
    const scene = buildIllustrationScene();
    const nextSignature = `${state.sceneVersion}|${scene.width}|${scene.height}|${controls.stylePreset.value}|${controls.materialPreset.value}|${controls.backgroundColor.value}|${controls.projection.value}|${controls.showHydrogens.checked}|${controls.showUnitCell.checked}|${controls.supercellA.value}|${controls.supercellB.value}|${controls.supercellC.value}|${controls.lightingPreset.value}|${controls.aoStrength.value}|${controls.aoRadius.value}|${JSON.stringify(viewer?.getView?.() || [])}`;
    if (!force && nextSignature === state.illustrationSignature) return;

    resizeIllustrationCanvas(canvas, scene.width, scene.height);
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, scene.width, scene.height);

    drawIllustrationBackground(ctx, scene);
    drawUnitCellCanvas(ctx, scene);
    scene.bonds.forEach((bond) => drawBondCanvas(ctx, bond, scene.rig));
    scene.atoms.forEach((atom) => drawAtomCanvas(ctx, atom, scene.rig));

    state.illustrationSignature = nextSignature;
    updateInfo();
  } catch (error) {
    console.error(error);
  }
}

function buildSvgMarkup() {
  const scene = buildIllustrationScene();
  const defs = [];
  const unitCellNodes = [];
  const bondNodes = [];
  const atomNodes = [];
  const svgNumber = (value) => Number(value).toFixed(2);

  defs.push(`
    <linearGradient id="bg-linear" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${scene.rig.backdropTop}"/>
      <stop offset="100%" stop-color="${scene.rig.backdropBottom}"/>
    </linearGradient>
    <radialGradient id="bg-glow-left" cx="18%" cy="16%" r="42%">
      <stop offset="0%" stop-color="${withAlpha(scene.rig.glowLeft, 0.52)}"/>
      <stop offset="100%" stop-color="${withAlpha(scene.rig.glowLeft, 0)}"/>
    </radialGradient>
    <radialGradient id="bg-glow-right" cx="84%" cy="12%" r="34%">
      <stop offset="0%" stop-color="${withAlpha(scene.rig.glowRight, 0.42)}"/>
      <stop offset="100%" stop-color="${withAlpha(scene.rig.glowRight, 0)}"/>
    </radialGradient>
  `);

  if (scene.unitCell) {
    scene.unitCell.edges.forEach((edge, index) => {
      unitCellNodes.push(`
        <line
          x1="${svgNumber(edge.start.x)}"
          y1="${svgNumber(edge.start.y)}"
          x2="${svgNumber(edge.end.x)}"
          y2="${svgNumber(edge.end.y)}"
          stroke="${scene.rig.cellColor}"
          stroke-width="1.35"
          stroke-dasharray="8 6"
          stroke-linecap="round"
        />
      `);
    });

    scene.unitCell.axes.forEach((axis) => {
      unitCellNodes.push(`
        <line
          x1="${svgNumber(axis.start.x)}"
          y1="${svgNumber(axis.start.y)}"
          x2="${svgNumber(axis.end.x)}"
          y2="${svgNumber(axis.end.y)}"
          stroke="${axis.color}"
          stroke-width="1.9"
          stroke-linecap="round"
        />
        <text
          x="${svgNumber(axis.end.x)}"
          y="${svgNumber(axis.end.y)}"
          fill="${axis.color}"
          font-family="Instrument Sans, Helvetica Neue, sans-serif"
          font-size="14"
          font-weight="600"
          text-anchor="middle"
          dominant-baseline="middle"
        >${axis.label}</text>
      `);
    });
  }

  scene.bonds.forEach((bond) => {
    const width = bond.mode === "cylinder" ? bond.width : Math.max(1.1, bond.width * 0.8);
    const edgeRatio = Math.min(0.38, 0.2 + scene.rig.softness * 0.09);

    bond.components.forEach((componentOffset, componentIndex) => {
      const offsetX = bond.normal.x * componentOffset * width * 0.9;
      const offsetY = bond.normal.y * componentOffset * width * 0.9;
      const startX = bond.a.x + offsetX;
      const startY = bond.a.y + offsetY;
      const endX = bond.b.x + offsetX;
      const endY = bond.b.y + offsetY;
      const gradientId = `bond-grad-${bond.id}-${componentIndex}`;
      const edgeA = deepenColor(bond.a.visual.stick?.color || bond.a.visual.baseColor, 0.08 + scene.rig.shadowDepth);
      const edgeB = deepenColor(bond.b.visual.stick?.color || bond.b.visual.baseColor, 0.08 + scene.rig.shadowDepth);
      const coreA = brightenColor(bond.a.visual.stick?.color || bond.a.visual.baseColor, 0.06 + scene.rig.softness * 0.06);
      const coreB = brightenColor(bond.b.visual.stick?.color || bond.b.visual.baseColor, 0.06 + scene.rig.softness * 0.06);

      defs.push(bond.mode === "cylinder"
        ? `
          <linearGradient
            id="${gradientId}"
            gradientUnits="userSpaceOnUse"
            x1="${svgNumber((startX + endX) / 2 - bond.normal.x * width)}"
            y1="${svgNumber((startY + endY) / 2 - bond.normal.y * width)}"
            x2="${svgNumber((startX + endX) / 2 + bond.normal.x * width)}"
            y2="${svgNumber((startY + endY) / 2 + bond.normal.y * width)}"
          >
            <stop offset="0%" stop-color="${edgeA}"/>
            <stop offset="${svgNumber(edgeRatio * 100)}%" stop-color="${coreA}"/>
            <stop offset="50%" stop-color="${brightenColor(mixColors(coreA, coreB, 0.5), 0.18)}"/>
            <stop offset="${svgNumber((1 - edgeRatio) * 100)}%" stop-color="${coreB}"/>
            <stop offset="100%" stop-color="${edgeB}"/>
          </linearGradient>
        `
        : `
          <linearGradient
            id="${gradientId}"
            gradientUnits="userSpaceOnUse"
            x1="${svgNumber(startX)}"
            y1="${svgNumber(startY)}"
            x2="${svgNumber(endX)}"
            y2="${svgNumber(endY)}"
          >
            <stop offset="0%" stop-color="${coreA}"/>
            <stop offset="100%" stop-color="${coreB}"/>
          </linearGradient>
        `);

      bondNodes.push(`
        <line
          x1="${svgNumber(startX)}"
          y1="${svgNumber(startY)}"
          x2="${svgNumber(endX)}"
          y2="${svgNumber(endY)}"
          stroke="url(#${gradientId})"
          stroke-width="${svgNumber(width * (bond.components.length > 1 ? 0.84 : 1))}"
          stroke-linecap="round"
          opacity="${svgNumber(bond.mode === "cylinder"
            ? Math.min(1, ((bond.a.visual.stick?.opacity || 0.94) + (bond.b.visual.stick?.opacity || 0.94)) / 2)
            : Math.min(1, ((bond.a.visual.line?.opacity || 0.94) + (bond.b.visual.line?.opacity || 0.94)) / 2))}"
        />
      `);
    });
  });

  scene.atoms.forEach((atom, index) => {
    if (!atom.visual.sphere || atom.radius <= 0) return;

    const light = scene.rig.lightVector;
    const highlightX = atom.x - light.x * atom.radius * 0.42;
    const highlightY = atom.y - light.y * atom.radius * 0.42;
    const highlightRadius = atom.radius * Math.max(0.12, 0.2 + scene.rig.softness * 0.05);
    const gradientId = `atom-grad-${index}`;

    defs.push(`
      <radialGradient
        id="${gradientId}"
        gradientUnits="userSpaceOnUse"
        cx="${svgNumber(highlightX)}"
        cy="${svgNumber(highlightY)}"
        r="${svgNumber(atom.radius * 1.04)}"
        fx="${svgNumber(highlightX)}"
        fy="${svgNumber(highlightY)}"
      >
        <stop offset="0%" stop-color="${brightenColor(atom.visual.sphere.color, 0.3 + scene.rig.softness * 0.08)}"/>
        <stop offset="42%" stop-color="${mixColors(atom.visual.sphere.color, deepenColor(atom.visual.sphere.color, 0.05 + scene.rig.shadowDepth * 0.3), 0.24)}"/>
        <stop offset="100%" stop-color="${deepenColor(atom.visual.sphere.color, 0.12 + scene.rig.shadowDepth)}"/>
      </radialGradient>
    `);

    atomNodes.push(`
      <circle
        cx="${svgNumber(atom.x)}"
        cy="${svgNumber(atom.y)}"
        r="${svgNumber(atom.radius)}"
        fill="url(#${gradientId})"
        stroke="${withAlpha(brightenColor(deepenColor(atom.visual.sphere.color, 0.12 + scene.rig.shadowDepth), 0.08), 0.82)}"
        stroke-width="${svgNumber(Math.max(0.8, atom.radius * 0.08))}"
        opacity="${svgNumber(atom.visual.sphere.opacity)}"
      />
    `);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">
  <defs>
    ${defs.join("\n")}
  </defs>
  <rect width="100%" height="100%" fill="url(#bg-linear)"/>
  <rect width="100%" height="100%" fill="url(#bg-glow-left)"/>
  <rect width="100%" height="100%" fill="url(#bg-glow-right)"/>
  ${unitCellNodes.join("\n")}
  ${bondNodes.join("\n")}
  ${atomNodes.join("\n")}
</svg>`;
}

function downloadSvg() {
  try {
    const markup = buildSvgMarkup();
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.fileName.replace(/\.[^.]+$/, "")}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("SVG 已导出");
  } catch (error) {
    console.error(error);
    setStatus(`SVG 导出失败：${error.message}`);
  }
}

function startIllustrationLoop() {
  const tick = () => {
    if (state.baseModel) {
      renderIllustrationCanvas();
    }
    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
}

function getOptimizationApiCandidates() {
  const candidates = [];

  if (window.location.protocol.startsWith("http")) {
    candidates.push(`${window.location.origin}/api/optimize`);
  }

  candidates.push("http://127.0.0.1:8765/api/optimize");
  return [...new Set(candidates)];
}

function padMolInt(value, width = 3) {
  return String(Math.trunc(value)).padStart(width, " ");
}

function formatMolFloat(value) {
  return Number(value || 0).toFixed(4).padStart(10, " ");
}

function molBondType(order) {
  if (order >= 2.5) return 3;
  if (order >= 1.75) return 2;
  if (order >= 1.4) return 4;
  return 1;
}

function buildCurrentMolBlock() {
  if (!state.baseModel || !state.sourceAtomCount) {
    throw new Error("当前没有可导出的分子结构。");
  }

  const allAtoms = state.baseModel.selectedAtoms({});
  const sourceAtoms = allAtoms
    .filter((atom) => Number(atom.index ?? -1) < state.sourceAtomCount)
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0));

  if (!sourceAtoms.length) {
    throw new Error("当前分子没有可用于优化的原始原子。");
  }

  const atomMap = new Map();
  sourceAtoms.forEach((atom, index) => {
    atomMap.set(atom.index ?? index, index);
  });

  const bonds = [];
  const seen = new Set();

  sourceAtoms.forEach((atom, atomIndex) => {
    const refs = Array.isArray(atom.bonds) ? atom.bonds : [];
    const orders = Array.isArray(atom.bondOrder) ? atom.bondOrder : [];

    refs.forEach((ref, bondIndex) => {
      const otherIndex = atomMap.get(ref);
      if (otherIndex === undefined || otherIndex === atomIndex) return;

      const key = atomIndex < otherIndex ? `${atomIndex}-${otherIndex}` : `${otherIndex}-${atomIndex}`;
      if (seen.has(key)) return;
      seen.add(key);

      bonds.push({
        a: atomIndex,
        b: otherIndex,
        type: molBondType(Number(orders[bondIndex] || 1)),
      });
    });
  });

  const header = [
    state.fileName.replace(/\.[^.]+$/, "").slice(0, 80) || "Lattice Studio",
    "  LatticeStudio RDKit",
    "",
  ];
  const counts = `${padMolInt(sourceAtoms.length)}${padMolInt(bonds.length)}  0  0  0  0            999 V2000`;

  const atomLines = sourceAtoms.map((atom) => {
    const element = normalizeElement(atom.elem || atom.atom) || "C";
    return `${formatMolFloat(atom.x)}${formatMolFloat(atom.y)}${formatMolFloat(atom.z)} ${element.padEnd(3, " ")} 0  0  0  0  0  0  0  0  0  0  0  0`;
  });

  const bondLines = bonds.map((bond) => (
    `${padMolInt(bond.a + 1)}${padMolInt(bond.b + 1)}${padMolInt(bond.type)}  0  0  0  0`
  ));

  return [...header, counts, ...atomLines, ...bondLines, "M  END"].join("\n");
}

async function optimizeWithLocalRDKit(atoms, steps) {
  if (state.isCrystal) {
    throw new Error("RDKit 本地优化仅适用于小分子。");
  }

  const molblock = buildCurrentMolBlock();
  const payload = {
    molblock,
    method: "AUTO",
    maxIters: Math.max(240, steps * 3),
  };
  const candidates = getOptimizationApiCandidates();
  let lastError = null;

  for (const endpoint of candidates) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "RDKit 优化失败");
      }

      const coordinates = result.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== atoms.length) {
        throw new Error("RDKit 返回的坐标数量不匹配");
      }

      window.clearTimeout(timer);
      return {
        coordinates,
        bondRmsd: 0,
        angleRmsd: 0,
        method: result.method || "RDKit",
        energy: result.energy,
        reembedded: Boolean(result.reembedded),
      };
    } catch (error) {
      window.clearTimeout(timer);
      lastError = error;
    }
  }

  throw lastError || new Error("无法连接本地 RDKit 服务");
}

function extractOptimizationGraph(atoms) {
  const lookup = new Map();
  const edges = [];
  const seen = new Set();

  atoms.forEach((atom, index) => {
    lookup.set(index, index);
    if (atom.index !== undefined) lookup.set(atom.index, index);
    if (atom.serial !== undefined) lookup.set(atom.serial, index);
  });

  atoms.forEach((atom, index) => {
    const bonds = Array.isArray(atom.bonds) ? atom.bonds : [];
    const bondOrders = Array.isArray(atom.bondOrder) ? atom.bondOrder : [];

    bonds.forEach((ref, bondIndex) => {
      const otherIndex = lookup.get(ref);
      if (otherIndex === undefined || otherIndex === index) return;

      const key = index < otherIndex ? `${index}-${otherIndex}` : `${otherIndex}-${index}`;
      if (seen.has(key)) return;

      seen.add(key);
      edges.push({
        a: index,
        b: otherIndex,
        order: Number(bondOrders[bondIndex] || 1),
      });
    });
  });

  return edges;
}

function targetBondLength(elementA, elementB, order) {
  const base = getCovalentRadius(elementA) + getCovalentRadius(elementB);
  if (order >= 2.5) return base * 0.82;
  if (order >= 1.5) return base * 0.9;
  return base;
}

function dotVectors(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vectorLength(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function normalizeSafe(vector) {
  const length = vectorLength(vector);
  if (length < 1e-8) {
    return { x: 0, y: 0, z: 1 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function cloneCoordinates(atoms) {
  return atoms.map((atom) => ({
    x: Number(atom.x || 0),
    y: Number(atom.y || 0),
    z: Number(atom.z || 0),
    vx: 0,
    vy: 0,
    vz: 0,
    element: normalizeElement(atom.elem || atom.atom),
  }));
}

function buildNeighborEntries(count, edges) {
  const neighborMap = Array.from({ length: count }, () => []);
  const bondedPairs = new Set();

  edges.forEach((edge, edgeIndex) => {
    neighborMap[edge.a].push({ index: edge.b, order: edge.order, edgeIndex });
    neighborMap[edge.b].push({ index: edge.a, order: edge.order, edgeIndex });
    bondedPairs.add(`${edge.a}-${edge.b}`);
    bondedPairs.add(`${edge.b}-${edge.a}`);
  });

  return { neighborMap, bondedPairs };
}

function canonicalizeCycle(cycle) {
  const sequence = [...cycle];
  const reversed = [...cycle].reverse();
  const candidates = [];

  [sequence, reversed].forEach((variant) => {
    for (let i = 0; i < variant.length; i += 1) {
      const rotated = [...variant.slice(i), ...variant.slice(0, i)];
      candidates.push(rotated.join("-"));
    }
  });

  candidates.sort();
  return candidates[0];
}

function findSmallCycles(neighborMap, maxSize = 8) {
  const cycles = [];
  const seen = new Set();

  function dfs(start, current, path, visited) {
    if (path.length > maxSize) return;

    neighborMap[current].forEach(({ index: next }) => {
      if (next === start && path.length >= 3) {
        const cycle = [...path];
        const key = canonicalizeCycle(cycle);
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
        return;
      }

      if (visited.has(next) || next < start || path.length >= maxSize) return;

      visited.add(next);
      path.push(next);
      dfs(start, next, path, visited);
      path.pop();
      visited.delete(next);
    });
  }

  for (let start = 0; start < neighborMap.length; start += 1) {
    const visited = new Set([start]);
    dfs(start, start, [start], visited);
  }

  return cycles;
}

function getRingMetadata(points, edges, neighborMap) {
  const cycles = findSmallCycles(neighborMap, 8);
  const ringAtoms = new Set();
  const aromaticAtoms = new Set();
  const aromaticCycles = [];
  const edgeLookup = new Map();

  edges.forEach((edge) => {
    edgeLookup.set(`${edge.a}-${edge.b}`, edge);
    edgeLookup.set(`${edge.b}-${edge.a}`, edge);
  });

  cycles.forEach((cycle) => {
    cycle.forEach((index) => ringAtoms.add(index));

    const cycleEdges = cycle.map((atomIndex, index) => {
      const nextIndex = cycle[(index + 1) % cycle.length];
      return edgeLookup.get(`${atomIndex}-${nextIndex}`);
    }).filter(Boolean);

    const aromatic = cycle.length >= 5
      && cycle.length <= 7
      && cycle.every((index) => ["C", "N", "O", "S"].includes(points[index].element))
      && cycleEdges.length === cycle.length
      && cycleEdges.every((edge) => edge.order >= 1.4);

    if (aromatic) {
      cycle.forEach((index) => aromaticAtoms.add(index));
      aromaticCycles.push(cycle);
    }
  });

  return { cycles, ringAtoms, aromaticAtoms, aromaticCycles };
}

function inferAtomGeometry(points, neighborMap, ringInfo) {
  return points.map((point, index) => {
    const neighbors = neighborMap[index];
    const orders = neighbors.map((entry) => entry.order);
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    const valence = orders.reduce((sum, value) => sum + value, 0);
    const element = point.element;
    const aromatic = ringInfo.aromaticAtoms.has(index);
    const inRing = ringInfo.ringAtoms.has(index);

    let geometry = "sp3";
    let targetAngleDeg = 109.5;
    let planar = false;

    if (maxOrder >= 2.5) {
      geometry = "sp";
      targetAngleDeg = 180;
      planar = true;
    } else if (aromatic || maxOrder >= 1.5) {
      geometry = "sp2";
      targetAngleDeg = 120;
      planar = true;
    } else if (neighbors.length <= 1) {
      geometry = "terminal";
      targetAngleDeg = 180;
      planar = false;
    } else if (element === "O") {
      geometry = inRing ? "sp2" : "sp3";
      targetAngleDeg = inRing ? 120 : 104.5;
      planar = inRing;
    } else if (element === "N") {
      if (neighbors.length === 2 && valence <= 2.2) {
        geometry = "sp2";
        targetAngleDeg = 120;
        planar = true;
      } else if (neighbors.length === 3 && valence < 3.4) {
        geometry = "sp3";
        targetAngleDeg = 107;
      } else if (neighbors.length >= 3) {
        geometry = "sp3";
        targetAngleDeg = 109.5;
      }
    } else if (neighbors.length === 2) {
      geometry = "sp3";
      targetAngleDeg = 109.5;
    } else if (neighbors.length >= 3) {
      geometry = "sp3";
      targetAngleDeg = 109.5;
    }

    if (element === "C" && neighbors.length === 2 && maxOrder < 1.4) {
      geometry = "sp3";
      targetAngleDeg = 112;
    }

    return {
      geometry,
      targetAngleDeg,
      targetAngleCos: Math.cos((targetAngleDeg * Math.PI) / 180),
      planar,
      aromatic,
      valence,
      neighborCount: neighbors.length,
    };
  });
}

function createPlanarityGroups(edges, neighborMap, geometryInfo, ringInfo) {
  const groups = [];
  const seen = new Set();

  const addGroup = (items) => {
    const unique = [...new Set(items)].sort((a, b) => a - b);
    if (unique.length < 3) return;
    const key = unique.join("-");
    if (seen.has(key)) return;
    seen.add(key);
    groups.push(unique);
  };

  ringInfo.aromaticCycles.forEach((cycle) => addGroup(cycle));

  geometryInfo.forEach((info, index) => {
    if (!info.planar) return;
    addGroup([index, ...neighborMap[index].map((entry) => entry.index)]);
  });

  edges.forEach((edge) => {
    if (edge.order < 1.5) return;
    addGroup([
      edge.a,
      edge.b,
      ...neighborMap[edge.a].map((entry) => entry.index).filter((index) => index !== edge.b),
      ...neighborMap[edge.b].map((entry) => entry.index).filter((index) => index !== edge.a),
    ]);
  });

  return groups;
}

function buildExcludedPairMap(neighborMap) {
  return neighborMap.map((neighbors, index) => {
    const excluded = new Set([index]);
    neighbors.forEach((entry) => {
      excluded.add(entry.index);
      neighborMap[entry.index].forEach((entry2) => excluded.add(entry2.index));
    });
    return excluded;
  });
}

function seedInitialGeometry(points, neighborMap, geometryInfo, seedIndex) {
  const zValues = points.map((point) => point.z);
  const zSpread = Math.max(...zValues) - Math.min(...zValues);
  const nearFlat = zSpread < 0.12;

  if (!nearFlat) return;

  points.forEach((point, index) => {
    const info = geometryInfo[index];
    const neighbors = neighborMap[index];

    if (info.planar) {
      point.z *= 0.12;
      return;
    }

    if (info.geometry === "sp3" && neighbors.length >= 2) {
      const vecA = subVectors(points[neighbors[0].index], point);
      const vecB = subVectors(points[neighbors[1].index], point);
      const normal = normalizeSafe(crossVectors(vecA, vecB));
      const sign = ((index + seedIndex) % 2 === 0) ? 1 : -1;
      const lift = 0.26 + (neighbors.length - 2) * 0.05;
      point.x += normal.x * lift * 0.08 * sign;
      point.y += normal.y * lift * 0.08 * sign;
      point.z += normal.z * lift * sign;
      return;
    }

    point.z += (((index + seedIndex) % 3) - 1) * 0.12;
  });
}

function computeBondRmsd(points, edges) {
  if (!edges.length) return 0;

  let total = 0;
  edges.forEach((edge) => {
    const a = points[edge.a];
    const b = points[edge.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const distance = Math.hypot(dx, dy, dz);
    const delta = distance - targetBondLength(a.element, b.element, edge.order);
    total += delta * delta;
  });

  return Math.sqrt(total / edges.length);
}

function computeAngleRmsd(points, neighborMap, geometryInfo) {
  let total = 0;
  let count = 0;

  neighborMap.forEach((neighbors, centerIndex) => {
    if (neighbors.length < 2) return;

    const target = geometryInfo[centerIndex].targetAngleDeg;
    const center = points[centerIndex];

    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        const atomA = points[neighbors[i].index];
        const atomB = points[neighbors[j].index];
        const va = subVectors(atomA, center);
        const vb = subVectors(atomB, center);
        const lenA = vectorLength(va);
        const lenB = vectorLength(vb);
        if (lenA < 1e-5 || lenB < 1e-5) continue;

        const cosTheta = clamp(dotVectors(va, vb) / (lenA * lenB), -1, 1);
        const angle = Math.acos(cosTheta) * 180 / Math.PI;
        total += (angle - target) ** 2;
        count += 1;
      }
    }
  });

  return count ? Math.sqrt(total / count) : 0;
}

function computeClashScore(points, excludedPairs) {
  let penalty = 0;

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (excludedPairs[i].has(j)) continue;

      const a = points[i];
      const b = points[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const distance = Math.hypot(dx, dy, dz);
      const minDistance = (getCovalentRadius(a.element) + getCovalentRadius(b.element)) * 1.28;
      if (distance < minDistance) {
        penalty += (minDistance - distance) ** 2;
      }
    }
  }

  return penalty;
}

function computePlanarityScore(points, planarityGroups) {
  let penalty = 0;

  planarityGroups.forEach((group) => {
    const centroid = group.reduce((acc, index) => addVectors(acc, points[index]), { x: 0, y: 0, z: 0 });
    centroid.x /= group.length;
    centroid.y /= group.length;
    centroid.z /= group.length;

    let normal = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < group.length; i += 1) {
      const current = subVectors(points[group[i]], centroid);
      const next = subVectors(points[group[(i + 1) % group.length]], centroid);
      normal = addVectors(normal, crossVectors(current, next));
    }
    normal = normalizeSafe(normal);

    group.forEach((index) => {
      const dist = dotVectors(subVectors(points[index], centroid), normal);
      penalty += dist * dist;
    });
  });

  return penalty;
}

function scoreOptimization(points, edges, neighborMap, geometryInfo, excludedPairs, planarityGroups) {
  const bondRmsd = computeBondRmsd(points, edges);
  const angleRmsd = computeAngleRmsd(points, neighborMap, geometryInfo);
  const clashPenalty = computeClashScore(points, excludedPairs);
  const planarityPenalty = computePlanarityScore(points, planarityGroups);

  return {
    bondRmsd,
    angleRmsd,
    clashPenalty,
    planarityPenalty,
    totalScore: bondRmsd * 3.4 + angleRmsd * 0.018 + clashPenalty * 0.6 + planarityPenalty * 0.42,
  };
}

function runSingleOptimization(points, edges, neighborMap, geometryInfo, planarityGroups, excludedPairs, steps) {
  const bondK = 0.24;
  const angleK = 0.06;
  const planarityK = 0.11;
  const repulsionK = 0.085;
  const damping = 0.78;

  for (let iteration = 0; iteration < steps; iteration += 1) {
    const cooling = 1 - (iteration / Math.max(steps, 1)) * 0.42;
    const stepSize = 0.16 * cooling;
    const forces = points.map(() => ({ x: 0, y: 0, z: 0 }));

    edges.forEach((edge) => {
      const a = points[edge.a];
      const b = points[edge.b];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dz = b.z - a.z;
      let distance = Math.hypot(dx, dy, dz);

      if (distance < 1e-6) {
        dx = 0.02 * (edge.a + 1);
        dy = -0.02 * (edge.b + 1);
        dz = 0.015 * (((edge.a + edge.b) % 5) - 2);
        distance = Math.hypot(dx, dy, dz);
      }

      const target = targetBondLength(a.element, b.element, edge.order);
      const scale = (bondK * (distance - target)) / distance;
      const fx = dx * scale;
      const fy = dy * scale;
      const fz = dz * scale;

      forces[edge.a].x += fx;
      forces[edge.a].y += fy;
      forces[edge.a].z += fz;
      forces[edge.b].x -= fx;
      forces[edge.b].y -= fy;
      forces[edge.b].z -= fz;
    });

    neighborMap.forEach((neighbors, centerIndex) => {
      if (neighbors.length < 2) return;

      const center = points[centerIndex];
      const targetCos = geometryInfo[centerIndex].targetAngleCos;
      const centerWeight = geometryInfo[centerIndex].geometry === "sp" ? 0.45 : 0.22;

      for (let i = 0; i < neighbors.length; i += 1) {
        for (let j = i + 1; j < neighbors.length; j += 1) {
          const atomA = points[neighbors[i].index];
          const atomB = points[neighbors[j].index];
          const va = subVectors(atomA, center);
          const vb = subVectors(atomB, center);
          const lenA = vectorLength(va);
          const lenB = vectorLength(vb);
          if (lenA < 1e-6 || lenB < 1e-6) continue;

          const cosTheta = clamp(dotVectors(va, vb) / (lenA * lenB), -1, 1);
          const scale = angleK * (cosTheta - targetCos);
          const ax = ((va.x / lenA) - (vb.x / lenB)) * scale;
          const ay = ((va.y / lenA) - (vb.y / lenB)) * scale;
          const az = ((va.z / lenA) - (vb.z / lenB)) * scale;
          const bx = ((vb.x / lenB) - (va.x / lenA)) * scale;
          const by = ((vb.y / lenB) - (va.y / lenA)) * scale;
          const bz = ((vb.z / lenB) - (va.z / lenA)) * scale;

          forces[neighbors[i].index].x += ax;
          forces[neighbors[i].index].y += ay;
          forces[neighbors[i].index].z += az;
          forces[neighbors[j].index].x += bx;
          forces[neighbors[j].index].y += by;
          forces[neighbors[j].index].z += bz;
          forces[centerIndex].x -= (ax + bx) * centerWeight;
          forces[centerIndex].y -= (ay + by) * centerWeight;
          forces[centerIndex].z -= (az + bz) * centerWeight;
        }
      }
    });

    planarityGroups.forEach((group) => {
      const centroid = group.reduce((acc, index) => addVectors(acc, points[index]), { x: 0, y: 0, z: 0 });
      centroid.x /= group.length;
      centroid.y /= group.length;
      centroid.z /= group.length;

      let normal = { x: 0, y: 0, z: 0 };
      for (let i = 0; i < group.length; i += 1) {
        const current = subVectors(points[group[i]], centroid);
        const next = subVectors(points[group[(i + 1) % group.length]], centroid);
        normal = addVectors(normal, crossVectors(current, next));
      }
      normal = normalizeSafe(normal);

      group.forEach((index) => {
        const dist = dotVectors(subVectors(points[index], centroid), normal);
        forces[index].x -= normal.x * dist * planarityK;
        forces[index].y -= normal.y * dist * planarityK;
        forces[index].z -= normal.z * dist * planarityK;
      });
    });

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        if (excludedPairs[i].has(j)) continue;

        const a = points[i];
        const b = points[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dz = b.z - a.z;
        let distance = Math.hypot(dx, dy, dz);

        if (distance < 1e-6) {
          dx = 0.025;
          dy = -0.015;
          dz = 0.02;
          distance = Math.hypot(dx, dy, dz);
        }

        const minDistance = (getCovalentRadius(a.element) + getCovalentRadius(b.element)) * 1.28;
        if (distance >= minDistance) continue;

        const scale = (repulsionK * (minDistance - distance)) / distance;
        const fx = dx * scale;
        const fy = dy * scale;
        const fz = dz * scale;

        forces[i].x -= fx;
        forces[i].y -= fy;
        forces[i].z -= fz;
        forces[j].x += fx;
        forces[j].y += fy;
        forces[j].z += fz;
      }
    }

    let meanX = 0;
    let meanY = 0;
    let meanZ = 0;

    points.forEach((point, index) => {
      point.vx = (point.vx + forces[index].x * stepSize) * damping;
      point.vy = (point.vy + forces[index].y * stepSize) * damping;
      point.vz = (point.vz + forces[index].z * stepSize) * damping;
      point.x += point.vx;
      point.y += point.vy;
      point.z += point.vz;
      meanX += point.x;
      meanY += point.y;
      meanZ += point.z;
    });

    meanX /= points.length;
    meanY /= points.length;
    meanZ /= points.length;

    points.forEach((point) => {
      point.x -= meanX;
      point.y -= meanY;
      point.z -= meanZ;
    });
  }
}

function runQuickOptimization(atoms, steps) {
  const edges = extractOptimizationGraph(atoms);
  if (!edges.length) {
    throw new Error("当前结构没有可识别的键，无法执行快速优化。");
  }

  const basePoints = cloneCoordinates(atoms);
  const { neighborMap } = buildNeighborEntries(basePoints.length, edges);
  const ringInfo = getRingMetadata(basePoints, edges, neighborMap);
  const geometryInfo = inferAtomGeometry(basePoints, neighborMap, ringInfo);
  const planarityGroups = createPlanarityGroups(edges, neighborMap, geometryInfo, ringInfo);
  const excludedPairs = buildExcludedPairMap(neighborMap);
  const initialZSpread = Math.max(...basePoints.map((point) => point.z)) - Math.min(...basePoints.map((point) => point.z));
  const seedCount = initialZSpread < 0.12 ? 5 : 3;
  let bestResult = null;

  for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
    const points = basePoints.map((point) => ({ ...point }));
    seedInitialGeometry(points, neighborMap, geometryInfo, seedIndex);
    runSingleOptimization(points, edges, neighborMap, geometryInfo, planarityGroups, excludedPairs, steps);
    const metrics = scoreOptimization(points, edges, neighborMap, geometryInfo, excludedPairs, planarityGroups);

    if (!bestResult || metrics.totalScore < bestResult.totalScore) {
      bestResult = {
        ...metrics,
        coordinates: points.map((point) => [point.x, point.y, point.z]),
      };
    }
  }

  return bestResult;
}

async function optimizeCurrentStructure() {
  if (!canOptimizeCurrentStructure() || state.optimizationRunning) return;

  state.optimizationRunning = true;
  updateOptimizationUI();
  setStatus("正在执行小分子快速优化...");

  await new Promise((resolve) => window.setTimeout(resolve, 20));

  try {
    const atoms = state.baseModel.selectedAtoms({})
      .filter((atom) => Number(atom.index ?? -1) < state.sourceAtomCount)
      .sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
    const steps = Number(controls.optimizeSteps.value);
    let result;

    try {
      result = await optimizeWithLocalRDKit(atoms, steps);
    } catch (rdkitError) {
      console.warn("Local RDKit optimization unavailable, falling back to browser optimizer.", rdkitError);
      result = runQuickOptimization(atoms, steps);
      result.method = "Browser FF";
    }

    state.coordinateOverrides = result.coordinates;
    renderStructure(false);
    if (result.method === "Browser FF") {
      state.optimizationSummary = "已优化（浏览器回退）";
      setStatus(`优化完成：键长偏差约 ${result.bondRmsd.toFixed(3)} Å，键角偏差约 ${result.angleRmsd.toFixed(1)}°`);
    } else {
      state.optimizationSummary = `已优化（${result.method}）`;
      const energyText = Number.isFinite(result.energy) ? `，能量 ${result.energy.toFixed(2)}` : "";
      const embedText = result.reembedded ? "，已重新嵌入构象" : "";
      setStatus(`优化完成：${result.method}${energyText}${embedText}`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`优化失败：${error.message}`);
  } finally {
    state.optimizationRunning = false;
    updateOptimizationUI();
    updateInfo();
  }
}

function restoreOriginalGeometry() {
  state.coordinateOverrides = null;
  state.optimizationSummary = "原始导入坐标";
  renderStructure(false);
  setStatus("已恢复原始导入坐标");
}

function bindControls() {
  controls.fileInput = $("fileInput");
  controls.stylePreset = $("stylePreset");
  controls.materialPreset = $("materialPreset");
  controls.atomScale = $("atomScale");
  controls.bondRadius = $("bondRadius");
  controls.showHydrogens = $("showHydrogens");
  controls.autoAddHydrogens = $("autoAddHydrogens");
  controls.showUnitCell = $("showUnitCell");
  controls.supercellA = $("supercellA");
  controls.supercellB = $("supercellB");
  controls.supercellC = $("supercellC");
  controls.lightingPreset = $("lightingPreset");
  controls.aoStrength = $("aoStrength");
  controls.aoRadius = $("aoRadius");
  controls.backgroundColor = $("backgroundColor");
  controls.projection = $("projection");
  controls.spinEnabled = $("spinEnabled");
  controls.dropzone = $("dropzone");
  controls.optimizeSteps = $("optimizeSteps");
  controls.optimizeButton = $("optimizeButton");
  controls.restoreGeometryButton = $("restoreGeometryButton");

  [
    "stylePreset",
    "materialPreset",
    "showHydrogens",
    "autoAddHydrogens",
    "showUnitCell",
    "supercellA",
    "supercellB",
    "supercellC",
    "lightingPreset",
    "backgroundColor",
    "spinEnabled",
  ].forEach((key) => controls[key].addEventListener("change", () => renderStructure(false)));

  controls.atomScale.addEventListener("input", () => {
    setRangeValue("atomScaleValue", controls.atomScale.value);
    renderStructure(false);
  });

  controls.bondRadius.addEventListener("input", () => {
    setRangeValue("bondRadiusValue", controls.bondRadius.value);
    renderStructure(false);
  });

  controls.aoStrength.addEventListener("input", () => {
    setRangeValue("aoStrengthValue", controls.aoStrength.value);
    renderStructure(false);
  });

  controls.aoRadius.addEventListener("input", () => {
    setRangeValue("aoRadiusValue", controls.aoRadius.value);
    renderStructure(false);
  });

  controls.projection.addEventListener("change", () => {
    renderStructure(false);
    setStatus(
      controls.projection.value === "perspective"
        ? "已切换为透视投影"
        : "已切换为正交投影（无透视）",
    );
  });

  controls.optimizeSteps.addEventListener("input", () => {
    setRangeValue("optimizeStepsValue", controls.optimizeSteps.value);
  });

  controls.fileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    await handleFile(file);
  });

  $("openFileButton").addEventListener("click", () => controls.fileInput.click());
  $("resetViewButton").addEventListener("click", () => {
    viewer.zoomTo();
    viewer.render();
    setStatus("视角已重置");
  });
  $("snapshotButton").addEventListener("click", downloadSnapshot);
  $("exportSvgButton").addEventListener("click", downloadSvg);
  controls.optimizeButton.addEventListener("click", optimizeCurrentStructure);
  controls.restoreGeometryButton.addEventListener("click", restoreOriginalGeometry);
  $("cifBlockSelect").addEventListener("change", (event) => {
    const nextIndex = Number(event.target.value);
    const nextBlock = state.cifBlocks[nextIndex];
    if (!nextBlock) return;

    state.selectedCifBlock = nextIndex;
    state.rawText = nextBlock.text;
    state.isCrystal = detectCrystal(state.format, state.rawText);
    state.coordinateOverrides = null;
    state.optimizationSummary = "原始导入坐标";
    state.generatedHydrogenCount = 0;
    state.fileName = `${state.baseFileName} · ${nextBlock.name}`;
    state.crystalCell = parseCrystalCell(state.format, state.rawText);
    state.renderAtomCount = 0;
    state.sceneVersion += 1;
    setStatus(`已切换到 CIF 结构块 ${nextBlock.name}`);
    renderStructure(true);
  });

  document.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => {
      const sample = SAMPLE_STRUCTURES[button.dataset.sample];
      loadStructure(sample.text, sample.format, sample.name, `已载入内置 ${sample.name} 示例`);
    });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    controls.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      controls.dropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    controls.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      controls.dropzone.classList.remove("is-dragover");
    });
  });

  controls.dropzone.addEventListener("drop", async (event) => {
    const [file] = event.dataTransfer.files;
    if (!file) return;
    await handleFile(file);
  });

  window.addEventListener("resize", () => {
    viewer.resize();
    state.illustrationSignature = "";
    renderIllustrationCanvas(true);
  });
}

function init() {
  if (!window.$3Dmol) {
    setStatus("3Dmol.js 未加载成功，请检查网络连接。");
    return;
  }

  viewer = window.$3Dmol.createViewer("viewer", {
    backgroundColor: controls.backgroundColor.value,
    antialias: true,
    id: "lattice-studio-viewer",
  });

  startIllustrationLoop();

  loadStructure(
    SAMPLE_STRUCTURES.benzene.text,
    SAMPLE_STRUCTURES.benzene.format,
    SAMPLE_STRUCTURES.benzene.name,
    "已载入内置 Benzene 示例",
  );
}

document.addEventListener("DOMContentLoaded", () => {
  bindControls();
  setRangeValue("atomScaleValue", $("atomScale").value);
  setRangeValue("bondRadiusValue", $("bondRadius").value);
  setRangeValue("aoStrengthValue", $("aoStrength").value);
  setRangeValue("aoRadiusValue", $("aoRadius").value);
  setRangeValue("optimizeStepsValue", $("optimizeSteps").value);
  updateStyleHint();
  updateLightHint();
  init();
});
