import chalk from 'chalk';
import path from 'path';
import { promises as fs } from 'fs';
import { collectFiles } from '../../utils/codebase.js';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

type FileMetrics = {
  file: string;
  lines: number;
  functions: number;
  branches: number;
  complexity: number;
};

export async function run(targetDir = process.cwd()): Promise<void> {
  console.log(chalk.blue('🧠 Checking code complexity...'));
  const files = await collectFiles(targetDir, { extensions: SOURCE_EXTENSIONS });
  if (files.length === 0) {
    console.log(chalk.yellow('No source files detected to analyze.'));
    return;
  }

  const metrics: FileMetrics[] = [];
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      metrics.push(analyzeFile(file, content));
    } catch {
      // ignore unreadable files
    }
  }

  if (metrics.length === 0) {
    console.log(chalk.yellow('Unable to read source files for complexity analysis.'));
    return;
  }

  const totalLines = metrics.reduce((sum, stat) => sum + stat.lines, 0);
  const avgComplexity = metrics.reduce((sum, stat) => sum + stat.complexity, 0) / metrics.length;
  const avgFunctions = metrics.reduce((sum, stat) => sum + stat.functions, 0) / metrics.length;
  const hotspots = [...metrics].sort((a, b) => b.complexity - a.complexity).slice(0, 5);

  console.log(
    chalk.green(
      `Analyzed ${metrics.length} files (${totalLines} LOC). Avg complexity score ${avgComplexity.toFixed(
        2,
      )}, avg functions per file ${avgFunctions.toFixed(1)}.`,
    ),
  );
  console.log(chalk.blue('Top complexity hotspots:'));
  hotspots.forEach((stat) => {
    console.log(
      `- ${path.relative(targetDir, stat.file)} :: score ${stat.complexity} | branches ${stat.branches} | lines ${stat.lines}`,
    );
  });
}

function analyzeFile(file: string, content: string): FileMetrics {
  const lines = content.split(/\r?\n/).length;
  const branches = matchCount(content, /\b(if|else if|for|while|case|catch)\b/g) + matchCount(content, /\?|\&\&|\|\|/g);
  const functions = matchCount(content, /\bfunction\b/g) + matchCount(content, /=>\s*\{/g);
  const nestingPenalty = Math.min(20, Math.round(matchCount(content, /\{/g) / 25));
  const complexity = Math.round(branches * 1.5 + functions * 0.5 + lines / 80 + nestingPenalty);
  return {
    file,
    lines,
    functions,
    branches,
    complexity,
  };
}

function matchCount(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}
