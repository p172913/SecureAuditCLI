import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, extractPackageInstalls, findCommands } from '../../utils/dockerfile.js';

const SUSPECT_PACKAGES: Record<string, string[]> = {
  npm: ['lodash', 'event-stream', 'handlebars', 'tar', 'express'],
  pip: ['requests', 'urllib3', 'django', 'flask'],
  apt: ['openssl', 'apache2', 'php', 'log4j'],
};

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🕵️‍♂️ Running Snyk-style dependency heuristics...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    const packages = extractPackageInstalls(meta);
    packages.forEach((pkg) => {
      const suspects = SUSPECT_PACKAGES[pkg.manager];
      if (suspects && suspects.some((suspect) => pkg.package.toLowerCase().startsWith(suspect))) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} (line ${pkg.line}); review advisories for this dependency.`);
      }
    });

    findCommands(meta, /npm\s+install/i).forEach((instruction) => {
      if (!/npm\s+(audit|ci)/i.test(instruction.value)) {
        findings.push(`${ref}: npm install at line ${instruction.line} lacks npm audit/ci hardening.`);
      }
      if (/ -g /.test(instruction.value)) {
        findings.push(`${ref}: Global npm install at line ${instruction.line}; minimize global tooling in images.`);
      }
    });

    findCommands(meta, /pip(?:3)?\s+install/i).forEach((instruction) => {
      if (!/--require-hashes/.test(instruction.value)) {
        findings.push(`${ref}: pip install at line ${instruction.line} missing --require-hashes for integrity.`);
      }
    });
  });

  if (findings.length === 0) {
    console.log(chalk.green('Snyk heuristics did not detect risky dependencies.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
