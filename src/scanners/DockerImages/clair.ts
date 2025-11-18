import chalk from 'chalk';
import path from 'path';
import {
  loadDockerfiles,
  extractPackageInstalls,
  detectCurlPipeSh,
  detectWgetPipeSh,
  findCommands,
} from '../../utils/dockerfile.js';

const HIGH_RISK_PACKAGES = ['openssl', 'glibc', 'bash', 'sudo', 'log4j', 'apache2', 'php', 'busybox'];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🛰️ Running Clair-style heuristics...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    detectCurlPipeSh(meta).forEach((instruction) => {
      findings.push(`${ref}: RUN at line ${instruction.line} pipes curl directly into ${instruction.value.includes('bash') ? 'bash' : 'sh'}.`);
    });
    detectWgetPipeSh(meta).forEach((instruction) => {
      findings.push(`${ref}: RUN at line ${instruction.line} pipes wget output into a shell.`);
    });
    findCommands(meta, /apt-key\s+add/i).forEach((instruction) => {
      findings.push(`${ref}: Deprecated apt-key usage at line ${instruction.line}; switch to signed repositories.`);
    });
    findCommands(meta, /apk\s+add(?!.*--no-cache)/i).forEach((instruction) => {
      findings.push(`${ref}: apk add without --no-cache (line ${instruction.line}) increases attack surface.`);
    });

    const packages = extractPackageInstalls(meta);
    packages.forEach((pkg) => {
      if (HIGH_RISK_PACKAGES.some((risk) => pkg.package.toLowerCase().startsWith(risk))) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} (line ${pkg.line}) – verify patched version.`);
      }
      if (!pkg.versionPinned && ['apt', 'yum', 'dnf', 'apk'].includes(pkg.manager)) {
        findings.push(`${ref}: ${pkg.manager} installs ${pkg.package} without version pinning (line ${pkg.line}).`);
      }
    });
  });

  if (findings.length === 0) {
    console.log(chalk.green('Clair heuristics did not detect obvious risks.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
