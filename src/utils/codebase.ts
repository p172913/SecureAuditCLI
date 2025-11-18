import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const DEFAULT_IGNORE = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'out',
  'reports',
  'tmp',
  'logs',
];

export interface CollectOptions {
  extensions?: string[];
  filenamePatterns?: RegExp[];
  ignore?: string[];
  maxFileSizeKb?: number;
}

export async function collectFiles(rootDir: string, options: CollectOptions = {}): Promise<string[]> {
  const extensions = (options.extensions ?? DEFAULT_EXTENSIONS).map((ext) => ext.toLowerCase());
  const ignore = new Set((options.ignore ?? DEFAULT_IGNORE).map((dir) => dir.toLowerCase()));
  const patterns = options.filenamePatterns ?? [];
  const maxSizeBytes = options.maxFileSizeKb ? options.maxFileSizeKb * 1024 : undefined;
  const files: string[] = [];

  async function walk(current: string): Promise<void> {
    let dirents;
    try {
      dirents = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const dirent of dirents) {
      const fullPath = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        if (ignore.has(dirent.name.toLowerCase())) {
          continue;
        }
        await walk(fullPath);
      } else if (dirent.isFile()) {
        const ext = path.extname(dirent.name).toLowerCase();
        const nameLower = dirent.name.toLowerCase();
        const matchesExtension =
          extensions.length === 0 || extensions.includes(ext) || extensions.includes(nameLower);
        const matchesPattern = patterns.some((regex) => regex.test(nameLower));
        if (!matchesExtension && !matchesPattern) {
          continue;
        }
        if (maxSizeBytes) {
          try {
            const stats = await fs.stat(fullPath);
            if (stats.size > maxSizeBytes) {
              continue;
            }
          } catch {
            continue;
          }
        }
        files.push(fullPath);
      }
    }
  }

  const absoluteRoot = path.resolve(rootDir);
  await walk(absoluteRoot);
  return files;
}

