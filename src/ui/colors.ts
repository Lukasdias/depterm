/**
 * Brutalist Yellow Color Palette
 * 
 * A raw, industrial aesthetic using only black and yellow tones.
 * Inspired by construction signage, industrial design, and brutalist architecture.
 */

export const colors = {
  // Base
  black: "#000000",
  white: "#FFFFFF",
  
  // Yellow spectrum (brutalist)
  yellow: {
    50: "#FFEE99",   // Lightest - highlights
    100: "#FFE066",  // Light - OK status
    200: "#FFCC00",  // Primary yellow - selection, accents
    300: "#E6B800",  // Darker yellow - borders
    400: "#CC9900",  // Dark - dimmed text
    500: "#996600",  // Very dark - muted elements
  },
  
  // Status colors (yellow-based)
  status: {
    ok: "#FFE066",      // Light yellow - all good
    patch: "#FFCC00",   // Primary yellow - patch available
    minor: "#FFCC00",   // Primary yellow - minor update
    major: "#FF6600",   // Orange-yellow - breaking changes
    error: "#FF3300",   // Red-orange - errors
    warning: "#FFCC00", // Primary yellow - warnings
  },
  
  // UI elements
  ui: {
    background: "#000000",
    foreground: "#FFCC00",
    border: "#FFCC00",
    selection: "#FFCC00",
    selectionText: "#000000",
    muted: "#996600",
    dim: "#CC9900",
  },
} as const;

// Semantic color helpers
export const getStatusColor = (type: "ok" | "patch" | "minor" | "major" | "error" | "warning") => {
  return colors.status[type];
};

export const getUpdateTypeColor = (type: "major" | "minor" | "patch") => {
  switch (type) {
    case "major":
      return colors.status.major;
    case "minor":
      return colors.status.minor;
    case "patch":
      return colors.status.patch;
    default:
      return colors.yellow[100];
  }
};
