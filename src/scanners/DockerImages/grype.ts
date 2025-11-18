import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, extractPackageInstalls } from '../../utils/dockerfile.js';

const CRITICAL_PACKAGES = ['openssl', 'log4j', 'glibc', 'bash', 'sudo', 'spring-web', 'struts', 'busybox'];
const EOL_BASES = [
  { pattern: /^alpine:(3\.1[0-2]|3\.13)/i, message: 'Alpine base image is EOL and no longer receives patches.' },
  { pattern: /^ubuntu:(12\.04|14\.04|16\.04|18\.04)/i, message: 'Ubuntu release is outside its standard support window.' },
  { pattern: /^centos:(6|7)/i, message: 'CentOS release is EOL; migrate to Stream or Rocky/Alma.' },
];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🧬 Running Grype-style vulnerability heuristics...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    meta.baseImages.forEach((base) => {
      const match = EOL_BASES.find((entry) => entry.pattern.test(base));
      if (match) {
        findings.push(`${ref}: ${match.message} (${base}).`);
      }
    });

    const packages = extractPackageInstalls(meta);
    packages.forEach((pkg) => {
      if (CRITICAL_PACKAGES.some((risk) => pkg.package.toLowerCase().startsWith(risk))) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} (line ${pkg.line}); ensure patched version.`);
      } else if (!pkg.versionPinned && ['apt', 'yum', 'dnf', 'apk'].includes(pkg.manager)) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} without pinning (line ${pkg.line}).`);
      }
    });
  });

  if (findings.length === 0) {
    console.log(chalk.green('Grype heuristics did not detect obvious risk signals.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
