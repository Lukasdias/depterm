import { $ } from 'bun';
import * as semver from 'semver';
import type { OutdatedInfo, PackageManager } from '../types/index.js';

interface OutdatedJsonEntry {
  current: string;
  wanted: string;
  latest: string;
  dependent?: string;
  location?: string;
}

interface OutdatedJson {
  [packageName: string]: OutdatedJsonEntry;
}

function determineUpdateType(current: string, wanted: string, latest: string): 'major' | 'minor' | 'patch' {
  const currentParsed = semver.coerce(current);
  const wantedParsed = semver.coerce(wanted);
  const latestParsed = semver.coerce(latest);

  if (!currentParsed || !wantedParsed) {
    return 'major';
  }

  if (semver.major(wantedParsed) > semver.major(currentParsed)) {
    return 'major';
  }

  if (semver.minor(wantedParsed) > semver.minor(currentParsed)) {
    return 'minor';
  }

  if (semver.patch(wantedParsed) > semver.patch(currentParsed)) {
    return 'patch';
  }

  if (latestParsed && semver.gt(latestParsed, currentParsed)) {
    if (semver.major(latestParsed) > semver.major(currentParsed)) {
      return 'major';
    } else if (semver.minor(latestParsed) > semver.minor(currentParsed)) {
      return 'minor';
    } else {
      return 'patch';
    }
  }

  return 'patch';
}

export async function getOutdatedPackages(
  manager: PackageManager,
  projectPath: string = process.cwd()
): Promise<OutdatedInfo[]> {
  try {
    let output = '';

    switch (manager) {
      case 'npm': {
        const result = await $`npm outdated --json`.cwd(projectPath).quiet();
        output = result.stdout.toString();
        break;
      }
      case 'yarn': {
        const result = await $`yarn outdated --json`.cwd(projectPath).quiet();
        output = result.stdout.toString();
        break;
      }
      case 'pnpm': {
        const result = await $`pnpm outdated --json`.cwd(projectPath).quiet();
        output = result.stdout.toString();
        break;
      }
      case 'bun': {
        const result = await $`bun outdated`.cwd(projectPath).quiet();
        const bunOutput = result.stdout.toString();
        return parseBunOutdated(bunOutput);
      }
    }

    const json: OutdatedJson = JSON.parse(output || '{}');
    return Object.entries(json).map(([name, data]) => ({
      name,
      current: data.current,
      wanted: data.wanted,
      latest: data.latest,
      type: determineUpdateType(data.current, data.wanted, data.latest),
    }));
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('code: 1') || message.includes('exit code 1')) {
        return [];
      }
    }
    throw new Error(`Failed to get outdated packages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseBunOutdated(output: string): OutdatedInfo[] {
  const lines = output.split('\n').filter(line => line.trim());
  const outdated: OutdatedInfo[] = [];

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+(\S+)\s+→\s+(\S+)/);
    if (match) {
      const name = match[1];
      const current = match[2];
      const latest = match[3];
      if (name && current && latest) {
        const type = determineUpdateType(current, latest, latest);
        outdated.push({
          name,
          current,
          wanted: latest,
          latest,
          type,
        });
      }
    }
  }

  return outdated;
}

export function isMajorUpgrade(current: string, target: string): boolean {
  const currentParsed = semver.coerce(current);
  const targetParsed = semver.coerce(target);

  if (!currentParsed || !targetParsed) {
    return true;
  }

  return semver.major(targetParsed) > semver.major(currentParsed);
}
