import { createCliRenderer, type CliRenderer } from "@opentui/core";
import type { Dependency, OutdatedInfo, Conflict, PackageManager } from "../types/index.js";
import type { PackageMetadata } from "../core/package-info.js";

export const renderer: CliRenderer = await createCliRenderer({ exitOnCtrlC: true });

export type ActionDialogState = {
  isOpen: boolean;
  selectedIndex: number;
  isUpgrading: boolean;
};

export const state = {
  dependencies: [] as Dependency[],
  outdated: [] as OutdatedInfo[],
  conflicts: [] as Conflict[],
  selectedIndex: 0,
  packageManager: "npm" as PackageManager,
  projectPath: process.cwd(),
  isLoading: true,
  safeMode: true,
  focusMode: "list" as "list" | "action",
  packageMetadata: new Map<string, PackageMetadata>(),
  metadataLoading: new Set<string>(),
  actionDialog: {
    isOpen: false,
    selectedIndex: 0,
    isUpgrading: false,
  } as ActionDialogState,
};

export function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path;
  return "..." + path.slice(-(maxLength - 3));
}

export function getManagerIcon(pm: string): string {
  switch (pm) {
    case "bun":
      return "🥟";
    case "pnpm":
      return "📦";
    case "yarn":
      return "🧶";
    case "npm":
      return "⬢";
    default:
      return "📦";
  }
}
