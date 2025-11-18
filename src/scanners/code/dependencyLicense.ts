import chalk from 'chalk';
import path from 'path';
import { promises as fs } from 'fs';
import { fileExists, readJson } from '../../utils/file.js';

const APPROVED_LICENSES = new Set(['mit', 'isc', 'bsd-2-clause', 'bsd-3-clause', 'apache-2.0', 'mpl-2.0']);
const REVIEW_KEYWORDS = ['gpl', 'agpl', 'lgpl', 'sspl'];

type LicenseFinding = {
  dependency: string;
  license: string | undefined;
  message: string;
};

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🪪 Checking dependency license compliance...'));
  const pkgPath = path.resolve(targetDir, 'package.json');
  if (!(await fileExists(pkgPath))) {
    console.log(chalk.yellow('package.json not found; skipping license audit.'));
    return;
  }

  const pkg = await readJson(pkgPath);
  const dependencies = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  if (Object.keys(dependencies).length === 0) {
    console.log(chalk.green('No dependencies declared; nothing to audit.'));
    return;
  }

  const findings: LicenseFinding[] = [];

  for (const name of Object.keys(dependencies)) {
    const license = await resolveLicense(targetDir, name);
    if (!license) {
      findings.push({
        dependency: name,
        license: undefined,
        message: 'License metadata missing.',
      });
      continue;
    }
    const normalized = license.toLowerCase();
    if (REVIEW_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
      findings.push({
        dependency: name,
        license,
        message: 'Contains copyleft license; legal review recommended.',
      });
      continue;
    }
    if (!APPROVED_LICENSES.has(normalized)) {
      findings.push({
        dependency: name,
        license,
        message: 'License not in approved list; manual verification required.',
      });
    }
  }

  if (findings.length === 0) {
    console.log(chalk.green('All dependencies have approved licenses.'));
    return;
  }

  console.log(chalk.yellow(`Found ${findings.length} dependencies needing attention:`));
  findings.forEach((finding) =>
    console.log(`- ${finding.dependency}: ${finding.license ?? 'unknown'} (${finding.message})`),
  );
}

async function resolveLicense(projectRoot: string, dependency: string): Promise<string | undefined> {
  const depPath = path.join(projectRoot, 'node_modules', dependency, 'package.json');
  try {
    const pkgContent = await fs.readFile(depPath, 'utf-8');
    const pkgJson = JSON.parse(pkgContent);
    const license = normalizeLicense(pkgJson.license);
    if (license) {
      return license;
    }
    if (Array.isArray(pkgJson.licenses)) {
      return pkgJson.licenses.map((entry: any) => entry?.type ?? '').filter(Boolean).join(' OR ') || undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeLicense(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.type) return value.type;
  return undefined;
}
