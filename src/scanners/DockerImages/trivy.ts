import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, extractPackageInstalls } from '../../utils/dockerfile.js';

const EOL_BASES = [
  { pattern: /^ubuntu:(12\.04|14\.04|16\.04|18\.04)/i, severity: 'CRITICAL', message: 'Ubuntu release is out of support.' },
  { pattern: /^debian:(jessie|stretch)/i, severity: 'HIGH', message: 'Debian release is EOL.' },
  { pattern: /^alpine:(3\.1[0-2]|3\.13)/i, severity: 'HIGH', message: 'Alpine release no longer receives patches.' },
  { pattern: /^centos:(6|7)/i, severity: 'CRITICAL', message: 'CentOS release reached end-of-life.' },
];

const HIGH_RISK_PACKAGES = ['openssl', 'glibc', 'bash', 'sudo', 'curl', 'wget', 'python2', 'log4j'];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🛡️ Evaluating Dockerfiles with Trivy-style heuristics...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to scan.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    meta.baseImages.forEach((base) => {
      const hit = EOL_BASES.find((entry) => entry.pattern.test(base));
      if (hit) {
        findings.push(`${ref}: [${hit.severity}] ${hit.message} (${base}).`);
      }
    });

    const packages = extractPackageInstalls(meta);
    packages.forEach((pkg) => {
      if (HIGH_RISK_PACKAGES.some((name) => pkg.package.toLowerCase().startsWith(name))) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} (line ${pkg.line}); verify patched CVEs.`);
      }
      if (!pkg.versionPinned && ['apt', 'apk', 'yum', 'dnf'].includes(pkg.manager)) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} without a fixed version (line ${pkg.line}).`);
      }
    });
  });

  if (findings.length === 0) {
    console.log(chalk.green('Trivy heuristics detected no obvious misconfigurations.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
