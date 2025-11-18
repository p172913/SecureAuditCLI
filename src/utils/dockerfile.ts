import { promises as fs } from 'fs';
import path from 'path';
import { collectFiles } from './codebase.js';

const DOCKERFILE_PATTERNS = [/^dockerfile$/i, /\.dockerfile$/i];

export interface DockerInstruction {
  type: string;
  value: string;
  raw: string;
  line: number;
}

export interface DockerfileMeta {
  path: string;
  instructions: DockerInstruction[];
  baseImages: string[];
  runs: DockerInstruction[];
  exposes: DockerInstruction[];
  users: DockerInstruction[];
  env: Record<string, string>;
  labels: Record<string, string>;
}

export interface PackageInstall {
  manager: string;
  package: string;
  versionPinned: boolean;
  line: number;
  dockerfile: string;
}

export async function loadDockerfiles(target?: string): Promise<DockerfileMeta[]> {
  const resolvedTarget = target ? path.resolve(target) : process.cwd();
  const stats = await fs.stat(resolvedTarget).catch(() => undefined);
  if (!stats) {
    return [];
  }

  if (stats.isFile()) {
    if (isDockerfilePath(resolvedTarget)) {
      const meta = await parseDockerfile(resolvedTarget);
      return meta ? [meta] : [];
    }
    return [];
  }

  const candidates = await collectFiles(resolvedTarget, {
    extensions: [],
    filenamePatterns: DOCKERFILE_PATTERNS,
  });

  const dockerfiles = candidates.filter(isDockerfilePath);
  const unique = [...new Set(dockerfiles)];
  const metas: DockerfileMeta[] = [];
  for (const filePath of unique) {
    const meta = await parseDockerfile(filePath);
    if (meta) {
      metas.push(meta);
    }
  }
  return metas;
}

function isDockerfilePath(filePath: string): boolean {
  const name = path.basename(filePath).toLowerCase();
  return name === 'dockerfile' || name.endsWith('.dockerfile') || name.startsWith('dockerfile.');
}

async function parseDockerfile(filePath: string): Promise<DockerfileMeta | undefined> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const instructions = extractInstructions(content);
    const baseImages: string[] = [];
    const runs: DockerInstruction[] = [];
    const exposes: DockerInstruction[] = [];
    const users: DockerInstruction[] = [];
    const env: Record<string, string> = {};
    const labels: Record<string, string> = {};

    for (const instruction of instructions) {
      switch (instruction.type) {
        case 'FROM':
          baseImages.push(instruction.value);
          break;
        case 'RUN':
          runs.push(instruction);
          break;
        case 'EXPOSE':
          exposes.push(instruction);
          break;
        case 'USER':
          users.push(instruction);
          break;
        case 'ENV':
          Object.assign(env, parseAssignments(instruction.value));
          break;
        case 'LABEL':
          Object.assign(labels, parseAssignments(instruction.value));
          break;
        default:
          break;
      }
    }

    return {
      path: filePath,
      instructions,
      baseImages,
      runs,
      exposes,
      users,
      env,
      labels,
    };
  } catch {
    return undefined;
  }
}

function extractInstructions(content: string): DockerInstruction[] {
  const instructions: DockerInstruction[] = [];
  const lines = content.split(/\r?\n/);
  let buffer = '';
  let startLine = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const originalLine = lines[i];
    if (originalLine === undefined) {
      continue;
    }
    const trimmed = originalLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (!buffer) {
      buffer = trimmed;
      startLine = i + 1;
    } else {
      buffer = `${buffer} ${trimmed}`;
    }

    if (trimmed.endsWith('\\')) {
      buffer = buffer.slice(0, -1).trim();
      continue;
    }

    const [keyword, ...rest] = buffer.split(/\s+/).filter(Boolean);
    if (!keyword) {
      buffer = '';
      startLine = 0;
      continue;
    }
    const type = keyword.toUpperCase();
    const value = rest.join(' ').trim();
    instructions.push({
      type,
      value,
      raw: buffer.trim(),
      line: startLine,
    });
    buffer = '';
    startLine = 0;
  }

  return instructions;
}

function parseAssignments(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value) {
    return result;
  }
  const tokens = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) {
      i += 1;
      continue;
    }
    if (token.includes('=')) {
      const [key, ...rest] = token.split('=');
      if (key) {
        result[key] = stripQuotes(rest.join('='));
      }
      i += 1;
    } else if (i + 1 < tokens.length) {
      const nextToken = tokens[i + 1];
      if (nextToken) {
        result[token] = stripQuotes(nextToken);
      }
      i += 2;
    } else {
      i += 1;
    }
  }
  return result;
}

function stripQuotes(value?: string): string {
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.slice(1, -1);
  }
  return value;
}

export function extractPackageInstalls(meta: DockerfileMeta): PackageInstall[] {
  const installs: PackageInstall[] = [];
  for (const run of meta.runs) {
    const segments = run.value
      .split(/&&|\|\||;/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    for (const segment of segments) {
      installs.push(...parsePackageSegment(segment, run.line, meta.path));
    }
  }
  return installs;
}

const PACKAGE_PATTERNS: Array<{
  manager: string;
  regex: RegExp;
  splitter: RegExp;
}> = [
  { manager: 'apt', regex: /apt(?:-get)?\s+install\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'yum', regex: /yum\s+install\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'dnf', regex: /dnf\s+install\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'apk', regex: /apk\s+add\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'pacman', regex: /pacman\s+-S\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'pip', regex: /pip(?:3)?\s+install\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'npm', regex: /npm\s+install\s+([^;&|]+)/i, splitter: /\s+/ },
  { manager: 'yarn', regex: /yarn\s+add\s+([^;&|]+)/i, splitter: /\s+/ },
];

function parsePackageSegment(segment: string, line: number, dockerfile: string): PackageInstall[] {
  const installs: PackageInstall[] = [];
  for (const pattern of PACKAGE_PATTERNS) {
    const match = segment.match(pattern.regex);
    if (!match) continue;
    const packagesPart = match[1];
    if (!packagesPart) {
      continue;
    }
    const rawPackages = packagesPart
      .replace(/\\\s*/g, ' ')
      .split(pattern.splitter)
      .map((token) => token.trim())
      .filter((token) => token && !token.startsWith('-'));
    for (const pkg of rawPackages) {
      installs.push({
        manager: pattern.manager,
        package: pkg,
        versionPinned: isVersionPinned(pkg, pattern.manager),
        line,
        dockerfile,
      });
    }
  }
  return installs;
}

function isVersionPinned(pkg: string, manager: string): boolean {
  if (pkg.includes('==') || pkg.includes('=') || pkg.includes('>=')) {
    return true;
  }
  if (manager === 'npm' || manager === 'yarn') {
    const lastAt = pkg.lastIndexOf('@');
    if (lastAt > 0 && /\d/.test(pkg.slice(lastAt + 1))) {
      return true;
    }
  }
  return false;
}

export function hasHealthcheck(meta: DockerfileMeta): boolean {
  return meta.instructions.some((instruction) => instruction.type === 'HEALTHCHECK');
}

export function finalUser(meta: DockerfileMeta): string | undefined {
  if (meta.users.length === 0) {
    return undefined;
  }
  const lastUser = meta.users[meta.users.length - 1];
  return lastUser ? lastUser.value.trim() : undefined;
}

export function exposedPorts(meta: DockerfileMeta): number[] {
  const ports: number[] = [];
  meta.exposes.forEach((instruction) => {
    instruction.value
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => {
        const numeric = Number(token.replace(/\/tcp|\/udp/gi, ''));
        if (!Number.isNaN(numeric)) {
          ports.push(numeric);
        }
      });
  });
  return ports;
}

export function detectCurlPipeSh(meta: DockerfileMeta): DockerInstruction[] {
  return meta.runs.filter((instruction) => /curl\s+[^\n]+\|\s*(sh|bash)/i.test(instruction.value));
}

export function detectWgetPipeSh(meta: DockerfileMeta): DockerInstruction[] {
  return meta.runs.filter((instruction) => /wget\s+[^\n]+\|\s*(sh|bash)/i.test(instruction.value));
}

export function findCommands(meta: DockerfileMeta, pattern: RegExp): DockerInstruction[] {
  return meta.runs.filter((instruction) => pattern.test(instruction.value));
}

