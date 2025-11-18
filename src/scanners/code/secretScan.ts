import chalk from 'chalk';
import path from 'path';
import { promises as fs } from 'fs';
import { collectFiles } from '../../utils/codebase.js';

const SECRET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml', '.env', '.properties', '.ini'];

type SecretPattern = {
  regex: RegExp;
  message: string;
};

const PATTERNS: SecretPattern[] = [
  { regex: /AKIA[0-9A-Z]{16}/g, message: 'Possible AWS access key detected.' },
  { regex: /ASIA[0-9A-Z]{16}/g, message: 'Possible AWS temporary access key detected.' },
  { regex: /aws(.{0,20})?(secret|access)_?key['"\s:=]+[A-Za-z0-9/+=]{20,}/gi, message: 'AWS secret key pattern detected.' },
  { regex: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g, message: 'Private key block detected.' },
  { regex: /xox[baprs]-[0-9a-zA-Z-]{10,48}/g, message: 'Potential Slack token detected.' },
  { regex: /(secret|password|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{16,}['"]?/gi, message: 'Hardcoded credential-like value.' },
  { regex: /google.?api.?key['"\s:=]+[A-Za-z0-9_-]{35,}/gi, message: 'Potential Google API key detected.' },
  { regex: /-----BEGIN CERTIFICATE-----/g, message: 'Certificate material embedded in repository.' },
];

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🔑 Scanning codebase for secrets...'));
  const files = await collectFiles(targetDir, {
    extensions: SECRET_EXTENSIONS,
    filenamePatterns: [/^\.env/, /^config/, /^credentials/],
    maxFileSizeKb: 512,
  });
  if (files.length === 0) {
    console.log(chalk.yellow('No relevant files found for secret scanning.'));
    return;
  }

  const findings: string[] = [];
  for (const file of files) {
    let content: string;
    try {
      content = await fs.readFile(file, 'utf-8');
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      PATTERNS.forEach((pattern) => {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(line)) {
          findings.push(`${path.relative(targetDir, file)}:${idx + 1} -> ${pattern.message}`);
        }
      });
    });
  }

  if (findings.length === 0) {
    console.log(chalk.green('No high-confidence secrets detected.'));
    return;
  }

  console.log(chalk.red(`Detected ${findings.length} potential secrets:`));
  findings.slice(0, 25).forEach((finding) => console.log(`- ${finding}`));
  if (findings.length > 25) {
    console.log(`...and ${findings.length - 25} additional findings.`);
  }
}
