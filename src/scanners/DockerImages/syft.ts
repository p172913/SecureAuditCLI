import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, extractPackageInstalls } from '../../utils/dockerfile.js';
import type { PackageInstall } from '../../utils/dockerfile.js';

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('📦 Generating SBOM-style insights (Syft)...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to inspect.'));
    return;
  }

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    const packages = extractPackageInstalls(meta);
    if (packages.length === 0) {
      console.log(`${ref}: No package installation commands detected.`);
      return;
    }
    const grouped = groupByManager(packages);
    const summary = Object.entries(grouped)
      .map(([manager, pkgs]) => `${manager}: ${pkgs.slice(0, 6).join(', ')}${pkgs.length > 6 ? ', …' : ''}`)
      .join(' | ');
    console.log(`${ref}: ${summary}`);
  });
}

function groupByManager(packages: PackageInstall[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  packages.forEach((pkg) => {
    if (!grouped[pkg.manager]) {
      grouped[pkg.manager] = [];
    }
    const bucket = grouped[pkg.manager]!;
    if (!bucket.includes(pkg.package)) {
      bucket.push(pkg.package);
    }
  });
  return grouped;
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
