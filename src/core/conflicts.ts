import { $ } from 'bun';
import type { Conflict, PackageManager } from '../types/index.js';

export async function checkConflicts(
  manager: PackageManager,
  projectPath: string = process.cwd()
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  try {
    const result = await runInstallDryRun(manager, projectPath);
    const warnings = extractWarnings(result);
    
    for (const warning of warnings) {
      const parsed = parseWarning(warning);
      if (parsed) {
        conflicts.push(parsed);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('peer dep')) {
      conflicts.push({
        package: 'unknown',
        reason: 'Peer dependency conflict detected',
        severity: 'warning',
      });
    }
  }

  try {
    const peerConflicts = await checkPeerDependencies(manager, projectPath);
    conflicts.push(...peerConflicts);
  } catch {
  }

  return conflicts;
}

async function runInstallDryRun(
  manager: PackageManager,
  projectPath: string
): Promise<string> {
  try {
    let result;
    switch (manager) {
      case 'npm': {
        result = await $`npm install --dry-run`.cwd(projectPath).quiet();
        break;
      }
      case 'yarn': {
        result = await $`yarn install --mode=skip-build`.cwd(projectPath).quiet();
        break;
      }
      case 'pnpm': {
        result = await $`pnpm install --frozen-lockfile`.cwd(projectPath).quiet();
        break;
      }
      case 'bun': {
        result = await $`bun install --dry-run`.cwd(projectPath).quiet();
        break;
      }
    }
    return result.stdout.toString() + result.stderr.toString();
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('code: 1') || message.includes('exit code 1')) {
        return message;
      }
    }
    throw error;
  }
}

function extractWarnings(output: string): string[] {
  const lines = output.split('\n');
  const warnings: string[] = [];

  for (const line of lines) {
    if (
      line.toLowerCase().includes('warning') ||
      line.toLowerCase().includes('peer') ||
      line.toLowerCase().includes('conflict') ||
      line.toLowerCase().includes('deprecated') ||
      line.toLowerCase().includes('unmet')
    ) {
      warnings.push(line.trim());
    }
  }

  return warnings;
}

function parseWarning(warning: string): Conflict | null {
  const lowerWarning = warning.toLowerCase();

  if (lowerWarning.includes('peer')) {
    const packageMatch = warning.match(/requires a peer of ([^@]+)/i);
    const packageName = packageMatch && packageMatch[1] ? packageMatch[1].trim() : 'unknown';

    return {
      package: packageName,
      reason: 'Missing or incompatible peer dependency',
      severity: 'warning',
    };
  }

  if (lowerWarning.includes('deprecated')) {
    const packageMatch = warning.match(/([\w-]+)@/);
    const packageName = packageMatch && packageMatch[1] ? packageMatch[1] : 'unknown';

    return {
      package: packageName,
      reason: 'Package is deprecated',
      severity: 'warning',
    };
  }

  if (lowerWarning.includes('conflict')) {
    return {
      package: 'project',
      reason: 'Dependency conflict detected',
      severity: 'error',
    };
  }

  return null;
}

async function checkPeerDependencies(
  manager: PackageManager,
  projectPath: string
): Promise<Conflict[]> {
  const conflicts: Conflict[] = [];

  try {
    let result;
    switch (manager) {
      case 'npm': {
        result = await $`npm ls`.cwd(projectPath).quiet();
        break;
      }
      case 'yarn': {
        result = await $`yarn list`.cwd(projectPath).quiet();
        break;
      }
      case 'pnpm': {
        result = await $`pnpm list`.cwd(projectPath).quiet();
        break;
      }
      case 'bun': {
        return conflicts;
      }
    }
    
    const output = result.stdout.toString() + result.stderr.toString();
    const peerLines = output.split('\n').filter(line => 
      line.toLowerCase().includes('peer') || 
      line.toLowerCase().includes('unmet')
    );

    for (const line of peerLines) {
      const packageMatch = line.match(/([\w-]+)@/);
      if (packageMatch && packageMatch[1]) {
        conflicts.push({
          package: packageMatch[1],
          reason: 'Peer dependency issue',
          severity: 'warning',
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const peerMatches = errorMessage.match(/peer dep[^:]*:\s*([^\n]+)/gi);

    if (peerMatches) {
      for (const match of peerMatches) {
        const pkgMatch = match.match(/([\w-]+)@/);
        if (pkgMatch && pkgMatch[1]) {
          conflicts.push({
            package: pkgMatch[1],
            reason: 'Peer dependency conflict',
            severity: 'error',
          });
        }
      }
    }
  }

  return conflicts;
}
