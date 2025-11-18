import chalk from 'chalk';
import path from 'path';
import {
  loadDockerfiles,
  hasHealthcheck,
  finalUser,
  extractPackageInstalls,
  findCommands,
} from '../../utils/dockerfile.js';

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🧼 Linting Dockerfiles with Hadolint-style rules...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to lint.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    if (!hasHealthcheck(meta)) {
      findings.push(`${ref}: Missing HEALTHCHECK instruction.`);
    }
    const user = finalUser(meta);
    if (!user || user === 'root') {
      findings.push(`${ref}: Final stage uses root; add USER to drop privileges.`);
    }

    meta.instructions
      .filter((instruction) => instruction.type === 'FROM')
      .forEach((instruction) => {
        if (!instruction.value.includes(':')) {
          findings.push(`${ref}: FROM "${instruction.value}" lacks an explicit tag.`);
        }
      });

    meta.instructions
      .filter((instruction) => instruction.type === 'ADD')
      .forEach((instruction) => {
        if (/https?:\/\//i.test(instruction.value)) {
          findings.push(`${ref}: ADD downloads remote content (line ${instruction.line}); prefer curl + verify.`);
        } else {
          findings.push(`${ref}: Prefer COPY over ADD unless extracting archives (line ${instruction.line}).`);
        }
      });

    findCommands(meta, /apt-get\s+update/i).forEach((instruction) => {
      if (!/rm\s+-rf\s+\/var\/lib\/apt\/lists/i.test(instruction.value)) {
        findings.push(`${ref}: RUN at line ${instruction.line} updates apt cache without cleaning it.`);
      }
    });

    findCommands(meta, /apt(?:-get)?\s+install/i).forEach((instruction) => {
      if (!/--no-install-recommends/.test(instruction.value)) {
        findings.push(`${ref}: apt install at line ${instruction.line} missing --no-install-recommends.`);
      }
    });

    findCommands(meta, /pip(?:3)?\s+install/i).forEach((instruction) => {
      if (!/--no-cache-dir/.test(instruction.value)) {
        findings.push(`${ref}: pip install at line ${instruction.line} missing --no-cache-dir.`);
      }
    });

    Object.keys(meta.env).forEach((key) => {
      if (/PASSWORD|SECRET|TOKEN/i.test(key)) {
        findings.push(`${ref}: ENV ${key} may leak secrets; move to runtime secrets.`);
      }
    });

    const packages = extractPackageInstalls(meta);
    const unpinned = packages.filter((pkg) => !pkg.versionPinned);
    if (unpinned.length > 0) {
      const sample = unpinned.slice(0, 3).map((pkg) => pkg.package).join(', ');
      findings.push(`${ref}: ${unpinned.length} packages installed without version pinning (e.g., ${sample}).`);
    }
  });

  if (findings.length === 0) {
    console.log(chalk.green('Hadolint heuristics passed with no warnings.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
