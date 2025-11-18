import chalk from 'chalk';
import path from 'path';
import semver from 'semver';
import { readJson, fileExists } from '../../utils/file.js';
import { fetchWithTimeout } from '../../utils/httpClient.js';

type DependencyEntry = {
  name: string;
  range: string;
  group: 'dependencies' | 'devDependencies';
};

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('📅 Checking for outdated dependencies...'));
  const pkgPath = path.resolve(targetDir, 'package.json');
  if (!(await fileExists(pkgPath))) {
    console.log(chalk.yellow('package.json not found; skipping dependency audit.'));
    return;
  }

  const pkg = await readJson(pkgPath);
  const entries: DependencyEntry[] = [
    ...Object.entries(pkg.dependencies ?? {}).map(([name, range]) => ({
      name,
      range: String(range),
      group: 'dependencies' as const,
    })),
    ...Object.entries(pkg.devDependencies ?? {}).map(([name, range]) => ({
      name,
      range: String(range),
      group: 'devDependencies' as const,
    })),
  ];

  if (entries.length === 0) {
    console.log(chalk.green('No npm dependencies declared.'));
    return;
  }

  const installedVersions = await loadInstalledVersions(targetDir);
  const findings: string[] = [];

  for (const entry of entries) {
    const installed = installedVersions[entry.name];
    let latest: string | undefined;
    try {
      latest = await fetchLatestVersion(entry.name);
    } catch (err) {
      findings.push(`${entry.name}: unable to query npm registry (${(err as Error).message}).`);
      continue;
    }
    if (!latest) {
      findings.push(`${entry.name}: latest version unavailable from registry.`);
      continue;
    }
    if (!installed) {
      findings.push(`${entry.name}: not installed locally (latest ${latest}).`);
      continue;
    }
    if (semver.valid(installed) && semver.valid(latest) && semver.lt(installed, latest)) {
      const diff = semver.diff(installed, latest) ?? 'patch';
      findings.push(
        `${entry.name} (${entry.group}) -> installed ${installed}, latest ${latest} (${diff} update available).`,
      );
    }
  }

  if (findings.length === 0) {
    console.log(chalk.green('All installed npm dependencies appear up-to-date.'));
    return;
  }

  console.log(chalk.yellow(`Detected ${findings.length} dependencies with available updates:`));
  findings.slice(0, 25).forEach((finding) => console.log(`- ${finding}`));
  if (findings.length > 25) {
    console.log(`...and ${findings.length - 25} more.`);
  }
}

async function loadInstalledVersions(projectRoot: string): Promise<Record<string, string>> {
  const versions: Record<string, string> = {};
  const lockPath = path.resolve(projectRoot, 'package-lock.json');
  if (!(await fileExists(lockPath))) {
    return versions;
  }

  try {
    const lockJson = await readJson(lockPath);
    if (lockJson.packages) {
      for (const [pkgPath, info] of Object.entries<any>(lockJson.packages)) {
        if (!info || typeof info !== 'object' || !info.version) continue;
        if (pkgPath === '') continue;
        const normalized = pkgPath.replace(/^node_modules\//, '');
        if (!versions[normalized]) {
          versions[normalized] = info.version;
        }
      }
    } else if (lockJson.dependencies) {
      for (const [name, info] of Object.entries<any>(lockJson.dependencies)) {
        if (info?.version && !versions[name]) {
          versions[name] = info.version;
        }
      }
    }
  } catch {
    // ignore malformed lockfiles
  }

  return versions;
}

async function fetchLatestVersion(name: string): Promise<string | undefined> {
  const encoded = encodeURIComponent(name);
  const response = await fetchWithTimeout(`https://registry.npmjs.org/${encoded}`, { timeoutMs: 8000 });
  if (!response.ok) {
    return undefined;
  }
  try {
    const data = (await response.json()) as any;
    const latest = data?.['dist-tags']?.latest;
    return typeof latest === 'string' ? latest : undefined;
  } catch {
    return undefined;
  }
}
