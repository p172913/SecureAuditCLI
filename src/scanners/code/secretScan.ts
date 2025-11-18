import chalk from 'chalk';
import { execAsync } from '../../exec.js';

export async function run() {
  console.log(chalk.blue('🔑 Scanning codebase for secrets...'));
  const tools = [
    { cmd: 'gitleaks detect .', tag: 'gitleaks'}
  ];
  for (const t of tools) {
    const res = await execAsync(t.cmd);
    console.log(chalk.yellow(`\n=== [${t.tag}] ===\n`));
    if (res.code === 0) {
      console.log(res.stdout);
    } else {
      console.error(chalk.red(res.stderr || res.stdout));
    }
  }
}
