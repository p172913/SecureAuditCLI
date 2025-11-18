import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles, finalUser, exposedPorts } from '../../utils/dockerfile.js';

const SECRET_KEYWORDS = ['PASSWORD', 'SECRET', 'TOKEN', 'ACCESS_KEY', 'API_KEY'];
const SENSITIVE_PORTS = [22, 2375, 2376];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🛡️ Evaluating Dockerfiles with Dockle-style checks...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    const user = finalUser(meta);
    if (!user || user === 'root') {
      findings.push(`${ref}: Container runs as root; create a dedicated service account.`);
    }

    const ports = exposedPorts(meta).filter((port) => SENSITIVE_PORTS.includes(port));
    if (ports.length > 0) {
      findings.push(`${ref}: Sensitive ports exposed (${ports.join(', ')}). Restrict or justify them.`);
    }

    Object.entries(meta.env).forEach(([key]) => {
      if (SECRET_KEYWORDS.some((keyword) => key.toUpperCase().includes(keyword))) {
        findings.push(`${ref}: ENV ${key} looks like a secret; avoid embedding credentials.`);
      }
    });

    meta.instructions
      .filter((instruction) => instruction.type === 'RUN')
      .forEach((instruction) => {
        if (/chmod\s+777/.test(instruction.value)) {
          findings.push(`${ref}: RUN at line ${instruction.line} grants chmod 777; tighten permissions.`);
        }
        if (/chown\s+root/.test(instruction.value)) {
          findings.push(`${ref}: RUN at line ${instruction.line} forces root ownership; verify necessity.`);
        }
      });

    meta.instructions
      .filter((instruction) => instruction.type === 'COPY' || instruction.type === 'ADD')
      .forEach((instruction) => {
        if (/\.(ssh|gnupg)\b/i.test(instruction.value) || /id_rsa/i.test(instruction.value)) {
          findings.push(`${ref}: ${instruction.type} at line ${instruction.line} copies secrets (.ssh) into the image.`);
        }
      });
  });

  if (findings.length === 0) {
    console.log(chalk.green('Dockle heuristics passed without findings.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
