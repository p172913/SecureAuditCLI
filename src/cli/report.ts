import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const REPORT_FILE = path.resolve(process.cwd(), 'secaudit-report.json');

export function showReport() {
  if (existsSync(REPORT_FILE)) {
    const content = readFileSync(REPORT_FILE, 'utf-8');
    console.log(chalk.blueBright('\n=== Last Scan Report ===\n'));
    console.log(content);
  } else {
    console.log(chalk.yellow('No past scan report found at:'), REPORT_FILE);
  }
}
