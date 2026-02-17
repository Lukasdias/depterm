export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface Dependency {
  name: string;
  currentVersion: string;
  type: 'dependency' | 'devDependency';
}

export interface OutdatedInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

export interface Conflict {
  package: string;
  reason: string;
  severity: 'warning' | 'error';
}

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export type ViewState = 'dashboard' | 'upgrade' | 'execution';

export interface UpgradeAction {
  name: string;
  current: string;
  target: string;
  type: 'patch' | 'minor' | 'major' | 'latest' | 'wanted';
}

export interface ExecutionLog {
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
