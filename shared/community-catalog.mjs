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
  const p = palettes[scene.palette];
  return {
    "data-community": "true",
    "data-c-font": scene.font,
    "data-c-layout": scene.layout,
    "data-c-spacing": scene.spacing,
    "data-c-corners": scene.corners,
    "data-c-background": scene.background,
    style: {
      "--paper": p.paper,
      "--ink": p.ink,
      "--muted": p.muted,
      "--dark": p.dark,
      "--peach": p.accent,
      "--line": p.line,
    },
  };
}
