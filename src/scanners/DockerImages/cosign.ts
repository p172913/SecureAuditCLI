import chalk from 'chalk';
import path from 'path';
import { loadDockerfiles } from '../../utils/dockerfile.js';

const REQUIRED_LABELS: Array<{ key: string; message: string }> = [
  { key: 'org.opencontainers.image.source', message: 'Add source repository reference for provenance.' },
  { key: 'org.opencontainers.image.revision', message: 'Embed the git SHA for traceability.' },
  { key: 'org.opencontainers.image.licenses', message: 'Declare the license for downstream attestation.' },
  { key: 'org.opencontainers.image.description', message: 'Provide a human-readable description for transparency.' },
];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🔏 Inspecting Dockerfiles for cosign readiness...'));
  const dockerfiles = await loadDockerfiles(targetDir);
  if (dockerfiles.length === 0) {
    console.log(chalk.yellow('No Dockerfiles found to analyze.'));
    return;
  }

  const findings: string[] = [];

  dockerfiles.forEach((meta) => {
    const ref = formatRef(targetDir, meta.path);
    REQUIRED_LABELS.forEach(({ key, message }) => {
      if (!meta.labels[key]) {
        findings.push(`${ref}: Missing LABEL "${key}". ${message}`);
      }
    });

    const hasCosignKey =
      meta.instructions.some((instruction) => instruction.type === 'ARG' && /COSIGN/i.test(instruction.value)) ||
      Object.keys(meta.env).some((key) => key.toUpperCase().includes('COSIGN'));
    if (!hasCosignKey) {
      findings.push(`${ref}: No COSIGN_* ARG/ENV placeholders detected; document signing workflow explicitly.`);
    }

    if (!meta.labels['org.opencontainers.image.signature']) {
      findings.push(`${ref}: Consider adding LABEL org.opencontainers.image.signature to point to signed artifact metadata.`);
    }
  });

  if (findings.length === 0) {
    console.log(chalk.green('Dockerfiles contain sufficient metadata for cosign attestations.'));
    return;
  }

  findings.forEach((finding) => console.log(`- ${finding}`));
}

function formatRef(targetDir: string, filePath: string): string {
  const relative = path.relative(targetDir, filePath);
  return relative && !relative.startsWith('..') ? relative : path.basename(filePath);
}
