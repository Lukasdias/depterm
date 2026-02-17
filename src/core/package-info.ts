export interface PackageMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: {
    name?: string;
    email?: string;
  } | string;
  maintainers?: Array<{ name: string; email?: string }>;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  } | string;
  license?: string;
  keywords?: string[];
  time?: {
    created: string;
    modified: string;
  };
  versions?: string[];
  "dist-tags"?: {
    latest: string;
  };
}

const packageCache = new Map<string, PackageMetadata>();
const pendingFetches = new Map<string, Promise<PackageMetadata | null>>();

export async function fetchPackageMetadata(
  packageName: string,
  signal?: AbortSignal
): Promise<PackageMetadata | null> {
  if (packageCache.has(packageName)) {
    return packageCache.get(packageName)!;
  }

  if (pendingFetches.has(packageName)) {
    return pendingFetches.get(packageName)!;
  }

  const fetchPromise = fetchFromNpm(packageName, signal);
  pendingFetches.set(packageName, fetchPromise);

  try {
    const result = await fetchPromise;
    if (result) {
      packageCache.set(packageName, result);
    }
    return result;
  } finally {
    pendingFetches.delete(packageName);
  }
}

async function fetchFromNpm(
  packageName: string,
  signal?: AbortSignal
): Promise<PackageMetadata | null> {
  try {
    const encodedName = packageName.replace("/", "%2F");
    const response = await fetch(`https://registry.npmjs.org/${encodedName}`, {
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return normalizeMetadata(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    console.error(`Failed to fetch metadata for ${packageName}:`, error);
    return null;
  }
}

function normalizeMetadata(data: any): PackageMetadata {
  return {
    name: data.name,
    description: data.description,
    version: data["dist-tags"]?.latest || data.version,
    author: normalizeAuthor(data.author),
    maintainers: data.maintainers,
    homepage: data.homepage,
    repository: data.repository,
    license: normalizeLicense(data.license),
    keywords: data.keywords,
    time: data.time,
    versions: data.versions ? Object.keys(data.versions) : undefined,
    "dist-tags": data["dist-tags"],
  };
}

function normalizeAuthor(
  author: string | { name: string; email?: string } | undefined
): { name?: string; email?: string } | string | undefined {
  if (!author) return undefined;
  if (typeof author === "string") return author;
  return {
    name: author.name,
    email: author.email,
  };
}

function normalizeLicense(
  license: string | { type: string; url?: string } | undefined
): string | undefined {
  if (!license) return undefined;
  if (typeof license === "string") return license;
  return license.type;
}

export function getCachedMetadata(packageName: string): PackageMetadata | undefined {
  return packageCache.get(packageName);
}

export function isFetchingMetadata(packageName: string): boolean {
  return pendingFetches.has(packageName);
}

export function clearMetadataCache(): void {
  packageCache.clear();
}

export function formatAuthor(
  author: PackageMetadata["author"]
): string | undefined {
  if (!author) return undefined;
  if (typeof author === "string") {
    return author.split("<")[0]?.trim();
  }
  return author.name;
}

export function formatRepository(
  repository: PackageMetadata["repository"]
): string | undefined {
  if (!repository) return undefined;
  if (typeof repository === "string") return repository;
  return repository.url;
}
