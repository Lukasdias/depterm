import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Dependency, PackageJson } from '../types/index.js';

export async function readPackageJson(projectPath: string = process.cwd()): Promise<PackageJson> {
  const packagePath = join(projectPath, 'package.json');
  
  try {
    const content = await readFile(packagePath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`package.json not found in ${projectPath}`);
    }
    throw new Error(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function extractDependencies(packageJson: PackageJson): Dependency[] {
  const dependencies: Dependency[] = [];

  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      dependencies.push({
        name,
        currentVersion: version,
        type: 'dependency',
      });
    }
  }

  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      dependencies.push({
        name,
        currentVersion: version,
        type: 'devDependency',
      });
    }
  }

  return dependencies;
}

export function getDependencyCount(packageJson: PackageJson): { dependencies: number; devDependencies: number } {
  return {
    dependencies: Object.keys(packageJson.dependencies ?? {}).length,
    devDependencies: Object.keys(packageJson.devDependencies ?? {}).length,
  };
}
