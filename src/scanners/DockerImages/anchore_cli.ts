import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, finalUser } from '../../utils/dockerfile.js';

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('⚓ Running Anchore-style policy checks...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    meta.baseImages.forEach((base) => {
      if (!base || !base.includes(':')) {
        findings.push(`${ref}: Base image "${base || 'latest'}" is not pinned to a tag or digest.`);
      } else if (/:latest$/i.test(base)) {
        findings.push(`${ref}: Base image "${base}" uses the floating latest tag.`);
      }
    });

    meta.instructions
      .filter((instruction) => instruction.type === 'COPY' || instruction.type === 'ADD')
      .forEach((instruction) => {
        const value = instruction.value.trim();
        const isContextCopy = /^(\.\/?|\.\.)/.test(value) || /\s\./.test(value);
        if (isContextCopy) {
          findings.push(`${ref}: ${instruction.type} at line ${instruction.line} copies the entire build context.`);
        }
        if (instruction.type === 'ADD' && /https?:\/\//i.test(value)) {
          findings.push(`${ref}: ADD downloads remote content (line ${instruction.line}); prefer curl/wget with verification.`);
        }
      });

    const user = finalUser(meta);
    if (!user || user === 'root') {
      findings.push(`${ref}: Final stage runs as root; define USER with a non-root account.`);
    }
  });

  if (findings.length === 0) {
    console.log(chalk.green('Anchore policy checks passed with no findings.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
