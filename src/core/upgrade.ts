import { $ } from 'bun';
import type { PackageManager, UpgradeAction } from '../types/index.js';

export interface UpgradeOptions {
  dryRun?: boolean;
  safeMode?: boolean;
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  output?: string;
}

export async function upgradePackage(
  manager: PackageManager,
  action: UpgradeAction,
  options: UpgradeOptions = {},
  projectPath: string = process.cwd()
): Promise<UpgradeResult> {
  if (options.safeMode && action.type === 'major') {
    return {
      success: false,
      message: 'Major upgrade blocked in safe mode. Use --no-safe-mode to proceed.',
    };
  }

  try {
    let command: string[];
    
    switch (manager) {
      case 'npm': {
        if (options.dryRun) {
          command = ['npm', 'install', `${action.name}@${action.target}`, '--dry-run'];
        } else {
          command = ['npm', 'install', `${action.name}@${action.target}`];
        }
        break;
      }
      case 'yarn': {
        if (options.dryRun) {
          command = ['yarn', 'upgrade', `${action.name}@${action.target}`, '--dry-run'];
        } else {
          command = ['yarn', 'upgrade', `${action.name}@${action.target}`];
        }
        break;
      }
      case 'pnpm': {
        if (options.dryRun) {
          command = ['pnpm', 'update', `${action.name}@${action.target}`, '--dry-run'];
        } else {
          command = ['pnpm', 'update', `${action.name}@${action.target}`];
        }
        break;
      }
      case 'bun': {
        if (options.dryRun) {
          command = ['bun', 'update', `${action.name}@${action.target}`, '--dry-run'];
        } else {
          command = ['bun', 'update', `${action.name}@${action.target}`];
        }
        break;
      }
    }

    const result = await $`${command}`.cwd(projectPath).quiet();
    
    return {
      success: true,
      message: `Successfully ${options.dryRun ? 'simulated' : 'upgraded'} ${action.name} to ${action.target}`,
      output: result.stdout.toString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to upgrade ${action.name}: ${errorMessage}`,
      output: errorMessage,
    };
  }
}

export async function upgradeMultiplePackages(
  manager: PackageManager,
  actions: UpgradeAction[],
  options: UpgradeOptions = {},
  projectPath: string = process.cwd()
): Promise<UpgradeResult[]> {
  const results: UpgradeResult[] = [];

  for (const action of actions) {
    const result = await upgradePackage(manager, action, options, projectPath);
    results.push(result);
    
    if (!result.success && options.safeMode) {
      break;
    }
  }

  return results;
}

export function getTargetVersion(
  current: string,
  wanted: string,
  latest: string,
  type: 'patch' | 'minor' | 'major' | 'latest'
): string {
  switch (type) {
    case 'patch':
    case 'minor':
    case 'major':
      return wanted;
    case 'latest':
      return latest;
    default:
      return wanted;
  }
}
