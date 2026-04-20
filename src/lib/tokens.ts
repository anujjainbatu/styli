export const colors = {
  bg: {
    base: "#0E0E13",
    surface: "#1C1C24",
    elevated: "#252530",
    overlay: "rgba(14,14,19,0.85)",
  },
  gold: {
    DEFAULT: "#C8A96E",
    light: "#DFC492",
    muted: "#8C7248",
  },
  cream: "#FAF8F2",
  muted: "#9A9AA8",
  border: "#2E2E3A",
  success: "#5CB87A",
  warning: "#D4A853",
  error: "#D4545A",
} as const;

export const BODY_SHAPES = [
  "hourglass",
  "pear",
  "apple",
  "rectangle",
  "inverted_triangle",
  "athletic",
  "oval",
  "diamond",
  "spoon",
] as const;

export const FACE_SHAPES = [
  "oval",
  "round",
  "square",
  "heart",
  "oblong",
  "diamond",
  "triangle",
] as const;

export const COLOR_SEASONS = [
  "bright_spring",
  "light_spring",
  "warm_spring",
  "light_summer",
  "cool_summer",
  "soft_summer",
  "soft_autumn",
  "warm_autumn",
  "deep_autumn",
  "deep_winter",
  "cool_winter",
  "bright_winter",
] as const;
