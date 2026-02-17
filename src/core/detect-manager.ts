import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageManager } from '../types/index.js';

const MANAGER_LOCKFILES: Record<PackageManager, string> = {
  bun: 'bun.lockb',
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
};

const PRIORITY_ORDER: PackageManager[] = ['bun', 'pnpm', 'yarn', 'npm'];

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(projectPath: string = process.cwd()): Promise<PackageManager> {
  for (const manager of PRIORITY_ORDER) {
    const lockfile = join(projectPath, MANAGER_LOCKFILES[manager]);
    if (await fileExists(lockfile)) {
      return manager;
    }
  }

  return 'npm';
}

export function getInstallCommand(manager: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    bun: 'install',
    pnpm: 'install',
    yarn: 'install',
    npm: 'install',
  };
  return commands[manager];
}

export function getOutdatedCommand(manager: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    bun: 'outdated',
    pnpm: 'outdated',
    yarn: 'outdated',
    npm: 'outdated',
  };
  return commands[manager];
}

export function getUpdateCommand(manager: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    bun: 'update',
    pnpm: 'update',
    yarn: 'upgrade',
    npm: 'update',
  };
  return commands[manager];
}

export function getExecuteCommand(manager: PackageManager): string[] {
  const commands: Record<PackageManager, string[]> = {
    bun: ['bun'],
    pnpm: ['pnpm'],
    yarn: ['yarn'],
    npm: ['npm'],
  };
  return commands[manager];
}
