export const colors = {
  black: "#000000",
  white: "#FFFFFF",
  
  yellow: {
    50: "#FFEE99",
    100: "#FFE066",
    200: "#FFCC00",
    300: "#E6B800",
    400: "#FF6B6B",
    500: "#FF5252",
  },
  
  red: {
    50: "#FFEBEB",
    100: "#FFC7C7",
    200: "#FF8A8A",
    300: "#FA4D4D",
    400: "#FF5252",
    500: "#CB3837",
  },
  
  status: {
    ok: "#FFE066",
    patch: "#FFCC00",
    minor: "#FFCC00",
    major: "#FF6600",
    error: "#FF3300",
    warning: "#FFCC00",
  },
  
  ui: {
    background: "#000000",
    foreground: "#FFCC00",
    border: "#FFCC00",
    selection: "#FFCC00",
    selectionText: "#000000",
    muted: "#FF5252",
    dim: "#FF6B6B",
  },
} as const;

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
