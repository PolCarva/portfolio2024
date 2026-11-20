export const palettes = {
  original: {
    paper: "#f2f0e9",
    ink: "#262824",
    muted: "#595d52",
    dark: "#20231f",
    accent: "#edb18e",
    line: "#b7b9ab",
  },
  midnight: {
    paper: "#e9edf7",
    ink: "#172139",
    muted: "#43516c",
    dark: "#101a30",
    accent: "#9eb8ff",
    line: "#a7b2ca",
  },
  forest: {
    paper: "#eff3e7",
    ink: "#203426",
    muted: "#4c6150",
    dark: "#172c20",
    accent: "#bad39a",
    line: "#a9bca6",
  },
  cherry: {
    paper: "#fff0ed",
    ink: "#492329",
    muted: "#77505a",
    dark: "#391d28",
    accent: "#f6adb1",
    line: "#d7aeb4",
  },
  cobalt: {
    paper: "#f1f0ff",
    ink: "#23214c",
    muted: "#56547b",
    dark: "#191835",
    accent: "#b8b2ff",
    line: "#b6b1d1",
  },
  desert: {
    paper: "#fff1de",
    ink: "#422f22",
    muted: "#725640",
    dark: "#30271f",
    accent: "#edba70",
    line: "#c9b497",
  },
  mono: {
    paper: "#f5f5f5",
    ink: "#222222",
    muted: "#555555",
    dark: "#171717",
    accent: "#cccccc",
    line: "#aaaaaa",
  },
};
export const originalScene = {
  theme: null,
  composition: null,
  version: 1,
  palette: "original",
  font: "original",
  layout: "original",
  spacing: "original",
  corners: "original",
  background: "plain",
  drawing: false,
  nodes: [],
};
export function sceneAttributes(scene) {
  const p = sceneColors(scene);
  const c = scene.composition;
  return {
    "data-community": "true",
    "data-c-font": scene.font,
    "data-c-layout": scene.layout,
    "data-c-spacing": scene.spacing,
    "data-c-corners": scene.corners,
    "data-c-background": scene.background,
    ...(c
      ? {
          "data-c-hero": c.hero,
          "data-c-align": c.align,
          "data-c-media": c.mediaRatio,
          "data-c-button": c.button,
        }
      : {}),
    style: {
      "--paper": p.paper,
      "--ink": p.ink,
      "--muted": p.muted,
      "--dark": p.dark,
      "--peach": p.accent,
      "--line": p.line,
      "--on-dark": p.onDark,
      "--on-accent": p.onAccent,
      ...(c
        ? {
            "--community-columns": c.columns,
            "--community-gap": c.gap + "px",
            "--community-space": c.sectionSpace + "px",
            "--community-border": c.borderWidth + "px",
          }
        : {}),
    },
  };
}

export const brushColors = {
  ink: null,
  accent: null,
  red: "#b64444",
  blue: "#365ec2",
  green: "#287246",
  violet: "#7542a3",
  gold: "#a16a15",
};

export function contrast(a, b) {
  const luminance = (hex) => {
    const v = hex
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return v[0] * 0.2126 + v[1] * 0.7152 + v[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function readableInk(background) {
  return contrast("#000000", background) >= contrast("#ffffff", background)
    ? "#000000"
    : "#ffffff";
}
export function sceneColors(scene) {
  const base = palettes[scene.palette] || palettes.original;
  if (!scene.theme)
    return {
      ...base,
      onDark: readableInk(base.dark),
      onAccent: readableInk(base.accent),
    };
  const t = scene.theme,
    ink = contrast(t.ink, t.paper) >= 4.5 ? t.ink : readableInk(t.paper);
  return {
    paper: t.paper,
    ink,
    muted: ink,
    dark: t.dark,
    accent: t.accent,
    line: ink,
    onDark: readableInk(t.dark),
    onAccent: readableInk(t.accent),
  };
}
export const communityMarkPath =
  "M5.66749 15.125C4.19428 15.125 3 16.3192 3 17.7925V24.5824C3 26.0557 4.19428 27.2499 5.66749 27.2499H12.5447C14.0179 27.2499 15.2121 26.0557 15.2121 24.5824V17.7925C15.2121 16.3192 16.4065 15.125 17.8796 15.125H24.5824C26.0556 15.125 27.2499 13.9307 27.2499 12.4575V5.66749C27.2499 4.19431 26.0556 3 24.5824 3H17.7052C16.232 3 15.0377 4.19431 15.0377 5.66749V12.4575C15.0377 13.9307 13.8435 15.125 12.3702 15.125H5.66749Z";
